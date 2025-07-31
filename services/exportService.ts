import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { PatientRecord, ExportOptions, DashboardMetrics } from '@/types'
import { formatCurrency, formatDate, getTopPerformingOffices } from '@/utils/dataHelpers'

export class ExportService {
  /**
   * Export data to Excel (XLSX) format
   */
  async exportToExcel(
    data: PatientRecord[], 
    options: ExportOptions,
    metrics?: DashboardMetrics
  ): Promise<void> {
    try {
      const workbook = XLSX.utils.book_new()

      // Main data sheet
      const mainSheetData = this.prepareDataForExcel(data, options.selectedColumns)
      const mainSheet = XLSX.utils.json_to_sheet(mainSheetData)
      
      // Auto-size columns
      const columnWidths = this.calculateColumnWidths(mainSheetData)
      mainSheet['!cols'] = columnWidths

      XLSX.utils.book_append_sheet(workbook, mainSheet, 'Patient Records')

      // Summary sheet with metrics
      if (metrics) {
        const summaryData = this.prepareSummaryForExcel(data, metrics)
        const summarySheet = XLSX.utils.json_to_sheet(summaryData)
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
      }

      // Analytics sheet
      const analyticsData = this.prepareAnalyticsForExcel(data)
      if (analyticsData.length > 0) {
        const analyticsSheet = XLSX.utils.json_to_sheet(analyticsData)
        XLSX.utils.book_append_sheet(workbook, analyticsSheet, 'Analytics')
      }

      // Generate filename
      const filename = this.generateFilename('excel', options.dateRange)
      
      // Write and download file
      XLSX.writeFile(workbook, filename)
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      throw new Error('Failed to export Excel file')
    }
  }

  /**
   * Export data to PDF format
   */
  async exportToPDF(
    data: PatientRecord[],
    options: ExportOptions,
    metrics?: DashboardMetrics,
    chartElements?: HTMLElement[]
  ): Promise<void> {
    try {
      const pdf = new jsPDF('l', 'mm', 'a4') // Landscape orientation
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      let currentY = margin

      // Header
      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Dental Analytics Report', pageWidth / 2, currentY, { align: 'center' })
      currentY += 15

      // Report metadata
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, margin, currentY)
      pdf.text(`Records: ${data.length}`, pageWidth - margin - 30, currentY)
      currentY += 15

      // Summary metrics
      if (metrics) {
        currentY = await this.addMetricsToPDF(pdf, metrics, margin, currentY, pageWidth)
      }

      // Charts (if provided)
      if (options.includeCharts && chartElements && chartElements.length > 0) {
        currentY = await this.addChartsToPDF(pdf, chartElements, margin, currentY, pageWidth, pageHeight)
      }

      // Data table
      currentY = await this.addDataTableToPDF(pdf, data, options, margin, currentY, pageWidth, pageHeight)

      // Generate filename and save
      const filename = this.generateFilename('pdf', options.dateRange)
      pdf.save(filename)
    } catch (error) {
      console.error('Error exporting to PDF:', error)
      throw new Error('Failed to export PDF file')
    }
  }

  /**
   * Export data to CSV format
   */
  async exportToCSV(data: PatientRecord[], options: ExportOptions): Promise<void> {
    try {
      const headers = this.getSelectedHeaders(options.selectedColumns)
      const csvContent = [
        headers.join(','),
        ...data.map(record => this.formatRecordForCSV(record, options.selectedColumns))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const filename = this.generateFilename('csv', options.dateRange)
      
      this.downloadBlob(blob, filename)
    } catch (error) {
      console.error('Error exporting to CSV:', error)
      throw new Error('Failed to export CSV file')
    }
  }

  /**
   * Prepare data for Excel export
   */
  private prepareDataForExcel(data: PatientRecord[], selectedColumns?: string[]): any[] {
    const columnsToInclude = selectedColumns || Object.keys(data[0] || {})
    
    return data.map(record => {
      const formattedRecord: any = {}
      
      columnsToInclude.forEach(column => {
        const value = record[column as keyof PatientRecord]
        
        switch (column) {
          case 'paidamount':
          case 'productivityamount':
            formattedRecord[this.getColumnLabel(column)] = typeof value === 'number' ? value : 0
            break
          case 'dos':
          case 'timestamp':
          case 'timestampbyinteraction':
            formattedRecord[this.getColumnLabel(column)] = value ? formatDate(value.toString()) : ''
            break
          default:
            formattedRecord[this.getColumnLabel(column)] = value || ''
        }
      })
      
      return formattedRecord
    })
  }

  /**
   * Prepare summary data for Excel export
   */
  private prepareSummaryForExcel(data: PatientRecord[], metrics: DashboardMetrics): any[] {
    const summary = [
      { Metric: 'Total Revenue', Value: formatCurrency(metrics.totalRevenue) },
      { Metric: 'Claims Processed', Value: metrics.claimsProcessed },
      { Metric: 'Average Claim', Value: formatCurrency(metrics.averageClaim) },
      { Metric: 'Active Offices', Value: metrics.activeOffices },
      { Metric: "Today's Claims", Value: metrics.todaysClaims },
      { Metric: 'Weekly Claims', Value: metrics.weeklyClaims },
      { Metric: 'Monthly Claims', Value: metrics.monthlyClaims },
      { Metric: '', Value: '' }, // Empty row
    ]

    // Add status breakdown
    const statusCounts = data.reduce((acc, record) => {
      acc[record.claimstatus] = (acc[record.claimstatus] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    Object.entries(statusCounts).forEach(([status, count]) => {
      summary.push({
        Metric: `${status} Claims`,
        Value: count
      })
    })

    return summary
  }

  /**
   * Prepare analytics data for Excel export
   */
  private prepareAnalyticsForExcel(data: PatientRecord[]): any[] {
    const topOffices = getTopPerformingOffices(data, 10)
    
    return topOffices.map(office => ({
      Office: office.office,
      Revenue: office.revenue,
      'Claims Count': office.claims,
      'Average Claim': office.averageClaim,
    }))
  }

  /**
   * Add metrics section to PDF
   */
  private async addMetricsToPDF(
    pdf: jsPDF,
    metrics: DashboardMetrics,
    margin: number,
    startY: number,
    pageWidth: number
  ): Promise<number> {
    let currentY = startY

    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Key Metrics', margin, currentY)
    currentY += 10

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')

    const metricsData = [
      ['Total Revenue', formatCurrency(metrics.totalRevenue)],
      ['Claims Processed', metrics.claimsProcessed.toString()],
      ['Average Claim', formatCurrency(metrics.averageClaim)],
      ['Active Offices', metrics.activeOffices.toString()],
    ]

    const columnWidth = (pageWidth - 2 * margin) / 4
    metricsData.forEach(([label, value], index) => {
      const x = margin + (index * columnWidth)
      pdf.setFont('helvetica', 'bold')
      pdf.text(label, x, currentY)
      pdf.setFont('helvetica', 'normal')
      pdf.text(value, x, currentY + 5)
    })

    return currentY + 20
  }

  /**
   * Add charts to PDF
   */
  private async addChartsToPDF(
    pdf: jsPDF,
    chartElements: HTMLElement[],
    margin: number,
    startY: number,
    pageWidth: number,
    pageHeight: number
  ): Promise<number> {
    let currentY = startY

    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Charts', margin, currentY)
    currentY += 10

    for (const chartElement of chartElements) {
      if (currentY > pageHeight - 100) {
        pdf.addPage()
        currentY = margin
      }

      try {
        const canvas = await html2canvas(chartElement, {
          scale: 1,
          useCORS: true,
          backgroundColor: '#ffffff'
        })

        const imgData = canvas.toDataURL('image/png')
        const imgWidth = Math.min(pageWidth - 2 * margin, 120)
        const imgHeight = (canvas.height * imgWidth) / canvas.width

        pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight)
        currentY += imgHeight + 10
      } catch (error) {
        console.error('Error adding chart to PDF:', error)
        // Continue with next chart
      }
    }

    return currentY + 10
  }

  /**
   * Add data table to PDF
   */
  private async addDataTableToPDF(
    pdf: jsPDF,
    data: PatientRecord[],
    options: ExportOptions,
    margin: number,
    startY: number,
    pageWidth: number,
    pageHeight: number
  ): Promise<number> {
    let currentY = startY

    if (currentY > pageHeight - 50) {
      pdf.addPage()
      currentY = margin
    }

    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Patient Records', margin, currentY)
    currentY += 10

    // For PDF, we'll show a condensed version of the data
    const condensedColumns = ['patientname', 'offices', 'paidamount', 'claimstatus', 'dos']
    const headers = condensedColumns.map(col => this.getColumnLabel(col))
    
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'bold')
    
    // Calculate column widths
    const availableWidth = pageWidth - 2 * margin
    const columnWidth = availableWidth / headers.length
    
    // Draw headers
    headers.forEach((header, index) => {
      const x = margin + (index * columnWidth)
      pdf.text(header, x, currentY)
    })
    currentY += 8

    // Draw data rows (limit to fit on page)
    pdf.setFont('helvetica', 'normal')
    const maxRows = Math.floor((pageHeight - currentY - margin) / 6)
    const displayData = data.slice(0, maxRows)

    displayData.forEach((record) => {
      condensedColumns.forEach((column, index) => {
        const x = margin + (index * columnWidth)
        let value = record[column as keyof PatientRecord] || ''
        
        if (column === 'paidamount') {
          value = formatCurrency(Number(value))
        } else if (column === 'dos') {
          value = value ? formatDate(value.toString()) : ''
        }
        
        // Truncate long text
        const text = value.toString()
        const truncated = text.length > 15 ? text.substring(0, 12) + '...' : text
        
        pdf.text(truncated, x, currentY)
      })
      currentY += 6
    })

    if (data.length > maxRows) {
      currentY += 10
      pdf.setFont('helvetica', 'italic')
      pdf.text(`... and ${data.length - maxRows} more records`, margin, currentY)
    }

    return currentY + 20
  }

  /**
   * Calculate column widths for Excel
   */
  private calculateColumnWidths(data: any[]): any[] {
    if (data.length === 0) return []

    const headers = Object.keys(data[0])
    return headers.map(header => {
      const maxLength = Math.max(
        header.length,
        ...data.map(row => String(row[header] || '').length)
      )
      return { wch: Math.min(maxLength + 2, 50) } // Max width of 50 characters
    })
  }

  /**
   * Get selected headers for export
   */
  private getSelectedHeaders(selectedColumns?: string[]): string[] {
    const defaultColumns = [
      'patientname', 'offices', 'insurancecarrier', 'paidamount', 
      'claimstatus', 'typeofinteraction', 'dos', 'emailaddress'
    ]
    
    const columns = selectedColumns || defaultColumns
    return columns.map(col => this.getColumnLabel(col))
  }

  /**
   * Format a record for CSV export
   */
  private formatRecordForCSV(record: PatientRecord, selectedColumns?: string[]): string {
    const defaultColumns = [
      'patientname', 'offices', 'insurancecarrier', 'paidamount', 
      'claimstatus', 'typeofinteraction', 'dos', 'emailaddress'
    ]
    
    const columns = selectedColumns || defaultColumns
    
    return columns.map(column => {
      let value = record[column as keyof PatientRecord] || ''
      
      // Format specific columns
      if (column === 'paidamount' || column === 'productivityamount') {
        value = Number(value) || 0
      } else if (column === 'dos' || column === 'timestamp' || column === 'timestampbyinteraction') {
        value = value ? formatDate(value.toString()) : ''
      }
      
      // Escape quotes and wrap in quotes if contains comma
      const stringValue = value.toString()
      const escaped = stringValue.replace(/"/g, '""')
      return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') 
        ? `"${escaped}"` 
        : escaped
    }).join(',')
  }

  /**
   * Get human-readable column label
   */
  private getColumnLabel(column: string): string {
    const labels: Record<string, string> = {
      patientname: 'Patient Name',
      offices: 'Office',
      insurancecarrier: 'Insurance Carrier',
      paidamount: 'Paid Amount',
      claimstatus: 'Claim Status',
      typeofinteraction: 'Type of Interaction',
      dos: 'Date of Service',
      timestampbyinteraction: 'Interaction Date',
      emailaddress: 'Email Address',
      commentsreasons: 'Comments/Reasons',
      missingdocsorinformation: 'Missing Documents',
      howweproceeded: 'How Proceeded',
      escalatedto: 'Escalated To',
      productivityamount: 'Productivity Amount',
      patientdob: 'Patient DOB',
      status: 'Status',
      timestamp: 'Timestamp'
    }
    
    return labels[column] || column
  }

  /**
   * Generate filename with timestamp
   */
  private generateFilename(format: string, dateRange?: { start: string; end: string }): string {
    const timestamp = new Date().toISOString().slice(0, 10)
    let filename = `dental-analytics-${timestamp}`
    
    if (dateRange) {
      filename += `-${dateRange.start}-to-${dateRange.end}`
    }
    
    return `${filename}.${format === 'excel' ? 'xlsx' : format}`
  }

  /**
   * Download blob as file
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }
}

// Create and export singleton instance
export const exportService = new ExportService()
