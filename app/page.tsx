'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import KPICards from '@/components/KPICards'
import FilterPanel from '@/components/FilterPanel'
import ChartsSection from '@/components/ChartsSection'
import DataTable from '@/components/DataTable'
import NotificationSystem from '@/components/NotificationSystem'
import { 
  PatientRecord, 
  DashboardState, 
  FilterState, 
  TableState,
  DashboardMetrics,
  ChartConfig 
} from '@/types'
import { calculateMetrics, filterData } from '@/utils/dataHelpers'
import { dataService } from '@/services/dataService'
import { exportService } from '@/services/exportService'

const initialFilters: FilterState = {
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  },
  offices: [],
  insuranceCarriers: [],
  claimStatus: [],
  interactionTypes: [],
  searchQuery: '',
  howProceeded: [],
  escalatedTo: [],
  missingDocs: [],
}

const initialTableState: TableState = {
  currentPage: 1,
  itemsPerPage: 10,
  sortBy: null,
  sortDirection: 'asc',
  searchQuery: '',
}

const initialChartConfigs: Record<string, ChartConfig> = {
  claimStatus: { type: 'doughnut', showLegend: true, showLabels: true, animated: true, responsive: true },
  revenueByOffice: { type: 'bar', showLegend: false, showLabels: true, animated: true, responsive: true },
  revenueByInsurer: { type: 'bar', showLegend: false, showLabels: true, animated: true, responsive: true },
  monthlyTrends: { type: 'line', showLegend: true, showLabels: false, animated: true, responsive: true },
  interactionTypes: { type: 'pie', showLegend: true, showLabels: true, animated: true, responsive: true },
  averagePayment: { type: 'bar', showLegend: false, showLabels: true, animated: true, responsive: true },
}

export default function DashboardPage() {
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    isLoading: true,
    data: [],
    filteredData: [],
    metrics: {} as DashboardMetrics,
    filters: initialFilters,
    tableState: initialTableState,
    chartConfigs: initialChartConfigs,
    notifications: [],
    theme: 'light',
    sidebarOpen: false,
  })

  // Load initial data
  useEffect(() => {
    loadData()
  }, [])

  // Filter data when filters change
  useEffect(() => {
    const filtered = filterData(dashboardState.data, dashboardState.filters)
    const metrics = calculateMetrics(filtered)
    
    setDashboardState(prev => ({
      ...prev,
      filteredData: filtered,
      metrics,
    }))
  }, [dashboardState.data, dashboardState.filters])

  const loadData = async () => {
    setDashboardState(prev => ({ ...prev, isLoading: true }))

    try {
      const data = await dataService.fetchPatientRecords()
      const filtered = filterData(data, dashboardState.filters)
      const metrics = calculateMetrics(filtered)

      setDashboardState(prev => ({
        ...prev,
        data,
        filteredData: filtered,
        metrics,
        isLoading: false,
      }))

      addNotification({
        type: 'success',
        title: 'Data Loaded',
        message: `Successfully loaded ${data.length} patient records`,
      })
    } catch (error) {
      console.error('Error loading data:', error)
      addNotification({
        type: 'error',
        title: 'Loading Error',
        message: 'Failed to load patient data. Please check your connection.',
      })

      setDashboardState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const addNotification = (notification: Omit<any, 'id' | 'timestamp'>) => {
    const newNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      autoClose: true,
      duration: 5000,
    }
    
    setDashboardState(prev => ({
      ...prev,
      notifications: [...prev.notifications, newNotification],
    }))
  }

  const removeNotification = (id: string) => {
    setDashboardState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== id),
    }))
  }

  const updateFilters = (newFilters: Partial<FilterState>) => {
    setDashboardState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters },
    }))
  }

  const clearFilters = () => {
    setDashboardState(prev => ({
      ...prev,
      filters: initialFilters,
    }))
  }

  const updateTableState = (newState: Partial<TableState>) => {
    setDashboardState(prev => ({
      ...prev,
      tableState: { ...prev.tableState, ...newState },
    }))
  }

  const updateChartConfig = (chartId: string, config: Partial<ChartConfig>) => {
    setDashboardState(prev => ({
      ...prev,
      chartConfigs: {
        ...prev.chartConfigs,
        [chartId]: { ...prev.chartConfigs[chartId], ...config },
      },
    }))
  }

  const exportData = async (options: any) => {
    try {
      addNotification({
        type: 'info',
        title: 'Export Started',
        message: `Exporting data in ${options.format} format...`,
      })

      switch (options.format) {
        case 'excel':
          await exportService.exportToExcel(dashboardState.filteredData, options, dashboardState.metrics)
          break
        case 'pdf':
          await exportService.exportToPDF(dashboardState.filteredData, options, dashboardState.metrics)
          break
        case 'csv':
          await exportService.exportToCSV(dashboardState.filteredData, options)
          break
        default:
          throw new Error('Unsupported export format')
      }

      addNotification({
        type: 'success',
        title: 'Export Complete',
        message: `Data exported successfully in ${options.format} format`,
      })
    } catch (error) {
      console.error('Export error:', error)
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: `Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    }
  }

  const toggleTheme = () => {
    const newTheme = dashboardState.theme === 'light' ? 'dark' : 'light'
    setDashboardState(prev => ({ ...prev, theme: newTheme }))
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  const activeFiltersCount = Object.values(dashboardState.filters).reduce((count, filter) => {
    if (Array.isArray(filter)) return count + filter.length
    if (typeof filter === 'string' && filter) return count + 1
    if (typeof filter === 'object' && filter !== null) {
      const { start, end } = filter as { start: string; end: string }
      if (start !== initialFilters.dateRange.start || end !== initialFilters.dateRange.end) {
        return count + 1
      }
    }
    return count
  }, 0)

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${dashboardState.theme}`}>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <Header
          title="Dental Analytics Dashboard"
          metrics={dashboardState.metrics}
          onRefresh={loadData}
          onExport={() => exportData({ format: 'excel' })}
          onThemeToggle={toggleTheme}
          isLoading={dashboardState.isLoading}
          theme={dashboardState.theme}
        />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Filters */}
          <div className="w-80 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <FilterPanel
              filters={dashboardState.filters}
              options={{
                offices: [...new Set(dashboardState.data.map(d => d.offices))].map(office => ({
                  value: office,
                  label: office,
                  count: dashboardState.data.filter(d => d.offices === office).length,
                })),
                insuranceCarriers: [...new Set(dashboardState.data.map(d => d.insurancecarrier))].map(carrier => ({
                  value: carrier,
                  label: carrier,
                  count: dashboardState.data.filter(d => d.insurancecarrier === carrier).length,
                })),
                claimStatus: [...new Set(dashboardState.data.map(d => d.claimstatus))].map(status => ({
                  value: status,
                  label: status,
                  count: dashboardState.data.filter(d => d.claimstatus === status).length,
                })),
                interactionTypes: [...new Set(dashboardState.data.map(d => d.typeofinteraction).filter(Boolean))].map(type => ({
                  value: type as string,
                  label: type as string,
                  count: dashboardState.data.filter(d => d.typeofinteraction === type).length,
                })),
              }}
              onFiltersChange={updateFilters}
              onClearFilters={clearFilters}
              activeFiltersCount={activeFiltersCount}
            />
          </div>

          {/* Main Dashboard Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* KPI Cards */}
              <KPICards 
                metrics={dashboardState.metrics}
                isLoading={dashboardState.isLoading}
              />

              {/* Charts Section */}
              <ChartsSection
                data={dashboardState.filteredData}
                configs={dashboardState.chartConfigs}
                onConfigChange={updateChartConfig}
                isLoading={dashboardState.isLoading}
              />

              {/* Data Table */}
              <DataTable
                data={dashboardState.filteredData}
                state={dashboardState.tableState}
                onStateChange={updateTableState}
                onExport={exportData}
                isLoading={dashboardState.isLoading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notification System */}
      <NotificationSystem
        notifications={dashboardState.notifications}
        onRemove={removeNotification}
      />
    </div>
  )
}
