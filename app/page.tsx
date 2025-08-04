'use client'

import { useState, useEffect } from 'react'
import { 
  Activity, 
  DollarSign, 
  FileText, 
  Calendar,
  Building, 
  TrendingUp, 
  Filter,
  Search,
  Download,
  Moon,
  Sun,
  RefreshCw,
  Bell,
  Settings,
  Users,
  Eye,
  MoreHorizontal,
  CheckSquare,
  Square,
  X,
  AlertCircle
} from 'lucide-react'
import SimpleCharts from '@/components/SimpleCharts'
import { dataService } from '@/services/dataService'
import { PatientRecord } from '@/types'
import { exportService } from '@/services/exportService'

// Enhanced notification system
interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  timestamp: Date
}

export default function DentalDashboard() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOffice, setSelectedOffice] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedClaimStatus, setSelectedClaimStatus] = useState('all')
  const [selectedCarrier, setSelectedCarrier] = useState('all')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [isClient, setIsClient] = useState(false)
  const [data, setData] = useState<PatientRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  
  // New states for enhanced table functionality
  const [selectedColumns, setSelectedColumns] = useState({
    patientName: true,
    carrier: true,
    offices: true,
    dos: true,
    claimStatus: true,
    comments: true,
    email: true,
    patientPortion: true,
    eftCheckDate: true,
    status: true
  })
  
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(25)
  const [sortBy, setSortBy] = useState<keyof PatientRecord | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Add notification function
  const addNotification = (type: Notification['type'], message: string) => {
    const notification: Notification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date()
    }
    setNotifications(prev => [notification, ...prev].slice(0, 5))
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 5000)
  }

  // Load data from Google Sheets with better error handling
  useEffect(() => {
    loadData()
    
    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(() => {
      loadData(true) // Silent reload
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Enhanced reload function
  const loadData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true)
        setError(null)
      }
      
      const patientData = await dataService.fetchPatientRecords()
      
      // Check for changes in data length for notifications
      if (data.length > 0 && patientData.length !== data.length) {
        const diff = patientData.length - data.length
        if (diff > 0) {
          addNotification('info', `${diff} new record(s) detected`)
        } else if (diff < 0) {
          addNotification('warning', `${Math.abs(diff)} record(s) removed`)
        }
      }
      
      setData(patientData)
      
      if (!silent) {
        addNotification('success', 'Data refreshed successfully')
      }
    } catch (err) {
      const errorMessage = 'Error loading data from Google Sheets'
      setError(errorMessage)
      addNotification('error', errorMessage)
      console.error('Error loading data:', err)
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  // Ensure consistent rendering between server and client
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Enhanced metrics calculation
  const totalRevenue = data.reduce((sum, item) => sum + item.paidamount, 0)
  
  // Modified Claims Processed - only count 'complete' status from column AF (status field)
  const claimsProcessed = data.filter(item => 
    item.status?.toLowerCase() === 'complete' || 
    item.status?.toLowerCase() === 'completed'
  ).length
  
  // Calculate monthly claims for current month
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthlyClaims = data.filter(item => {
    if (!item.timestamp) return false
    const itemDate = new Date(item.timestamp)
    return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear
  }).length
  
  // Calculate today's claims
  const today = new Date().toDateString()
  const todaysClaims = data.filter(item => {
    if (!item.timestamp) return false
    return new Date(item.timestamp).toDateString() === today
  }).length
  
  const activeOffices = new Set(data.map(item => item.offices).filter(Boolean)).size

  // Enhanced global search that filters across all relevant fields
  const filteredData = data.filter(item => {
    // Enhanced search filter - searches across multiple fields
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = !searchTerm || (
      item.patientname?.toLowerCase().includes(searchLower) ||
      item.emailaddress?.toLowerCase().includes(searchLower) ||
      item.insurancecarrier?.toLowerCase().includes(searchLower) ||
      item.offices?.toLowerCase().includes(searchLower) ||
      item.claimstatus?.toLowerCase().includes(searchLower) ||
      item.commentsreasons?.toLowerCase().includes(searchLower) ||
      item.dos?.toLowerCase().includes(searchLower)
    )
    
    // Other filters
    const matchesOffice = selectedOffice === 'all' || item.offices === selectedOffice
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus
    const matchesClaimStatus = selectedClaimStatus === 'all' || item.claimstatus === selectedClaimStatus
    const matchesCarrier = selectedCarrier === 'all' || item.insurancecarrier === selectedCarrier
    
    // Date range filter using DOS (column G)
    const matchesDateRange = !dateRange.start || !dateRange.end || 
      (item.dos && item.dos >= dateRange.start && item.dos <= dateRange.end)
    
    return matchesSearch && matchesOffice && matchesStatus && 
           matchesClaimStatus && matchesCarrier && matchesDateRange
  })

  // Sorting functionality
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortBy) return 0
    
    const aValue = a[sortBy] || ''
    const bValue = b[sortBy] || ''
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage)

  // Get unique values for filters
  const uniqueOffices = Array.from(new Set(data.map(item => item.offices).filter(Boolean)))
  const uniqueStatuses = Array.from(new Set(data.map(item => item.status).filter(Boolean)))
  const uniqueClaimStatuses = Array.from(new Set(data.map(item => item.claimstatus).filter(Boolean)))
  const uniqueCarriers = Array.from(new Set(data.map(item => item.insurancecarrier).filter(Boolean)))

  // PDF Export functionality
  const handlePDFExport = async () => {
    try {
      addNotification('info', 'Preparing PDF export...')
      await exportService.exportToPDF(filteredData, {
        title: 'Dental Analytics Report',
        includeCharts: true,
        filters: {
          search: searchTerm,
          office: selectedOffice,
          status: selectedStatus,
          claimStatus: selectedClaimStatus,
          carrier: selectedCarrier,
          dateRange
        }
      })
      addNotification('success', 'PDF exported successfully')
    } catch (error) {
      addNotification('error', 'Failed to export PDF')
      console.error('PDF export error:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'denied': return 'bg-red-100 text-red-800 border-red-200'
      case 'complete': 
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!isClient || !dateString) return dateString
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Handle sorting
  const handleSort = (column: keyof PatientRecord) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDirection('asc')
    }
  }

  // Toggle column visibility
  const toggleColumn = (column: keyof typeof selectedColumns) => {
    setSelectedColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }))
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Dental Analytics Dashboard...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => loadData()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`} suppressHydrationWarning>
      {/* Notification Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ${
              notification.type === 'success' ? 'bg-green-500 text-white' :
              notification.type === 'error' ? 'bg-red-500 text-white' :
              notification.type === 'warning' ? 'bg-yellow-500 text-white' :
              'bg-blue-500 text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{notification.message}</p>
              <button
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                className="ml-2 text-white hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          {/* Top Row */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Dental Analytics Dashboard
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Professional Dental Analytics Platform
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 relative"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
              </button>
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Toggle Theme"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => loadData()}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Refresh Data"
                disabled={loading}
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={handlePDFExport}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {/* Main KPI Cards - Updated with new layout */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Revenue */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-200" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>+12.5% from last month</span>
              </div>
            </div>

            {/* Claims Processed - Modified to count only 'complete' status */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Claims Processed</p>
                  <p className="text-2xl font-bold">{claimsProcessed}</p>
                </div>
                <FileText className="w-8 h-8 text-green-200" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>Complete status only</span>
              </div>
            </div>

            {/* Active Offices */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Active Offices</p>
                  <p className="text-2xl font-bold">{activeOffices}</p>
                </div>
                <Building className="w-8 h-8 text-orange-200" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                <span className="text-orange-100">All systems operational</span>
              </div>
            </div>

            {/* Today's Claims */}
            <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-sm font-medium">Today's Claims</p>
                  <p className="text-2xl font-bold">{todaysClaims}</p>
                </div>
                <Calendar className="w-8 h-8 text-pink-200" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>+15.3% vs yesterday</span>
              </div>
            </div>

            {/* Monthly Claims - New replacement for Average Claim */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Monthly Claims</p>
                  <p className="text-2xl font-bold">{monthlyClaims}</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-200" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>Current month total</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Enhanced Sidebar Filters */}
        <div className="w-80 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 h-screen overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters & Search</h2>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Enhanced Global Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Global Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patients, emails, carriers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              {searchTerm && (
                <p className="text-xs text-gray-500 mt-1">
                  Found {filteredData.length} results
                </p>
              )}
            </div>

            {/* Date Range Filter - Updated for DOS */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                DOS Date Range
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Office Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Office
              </label>
              <select
                value={selectedOffice}
                onChange={(e) => setSelectedOffice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Offices</option>
                {uniqueOffices.map(office => (
                  <option key={office} value={office}>{office}</option>
                ))}
              </select>
            </div>

            {/* Insurance Carrier Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Insurance Carrier
              </label>
              <select
                value={selectedCarrier}
                onChange={(e) => setSelectedCarrier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Carriers</option>
                {uniqueCarriers.map(carrier => (
                  <option key={carrier} value={carrier}>{carrier}</option>
                ))}
              </select>
            </div>

            {/* Claim Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Claim Status
              </label>
              <select
                value={selectedClaimStatus}
                onChange={(e) => setSelectedClaimStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Claim Statuses</option>
                {uniqueClaimStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Processing Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Statuses</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Column Visibility Controls */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Table Columns
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {Object.entries(selectedColumns).map(([key, value]) => (
                  <label key={key} className="flex items-center space-x-2 text-sm">
                    <button
                      onClick={() => toggleColumn(key as keyof typeof selectedColumns)}
                      className="flex items-center"
                    >
                      {value ? 
                        <CheckSquare className="w-4 h-4 text-blue-600" /> : 
                        <Square className="w-4 h-4 text-gray-400" />
                      }
                    </button>
                    <span className="text-gray-700 dark:text-gray-300 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter Summary */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">Summary</h3>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Total Records</span>
                  <span className="font-medium text-blue-600">{data.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Filtered Records</span>
                  <span className="font-medium text-green-600">{filteredData.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Complete Claims</span>
                  <span className="font-medium text-green-600">{claimsProcessed}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Monthly Claims</span>
                  <span className="font-medium text-purple-600">{monthlyClaims}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 space-y-6">
          {/* Interactive Charts Section */}
          <SimpleCharts data={filteredData} />

          {/* Enhanced Patient Records Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Patient Records</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} records
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={handlePDFExport}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-red-700 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>PDF</span>
                  </button>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 text-sm">
                    <Download className="w-4 h-4" />
                    <span>Excel</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Responsive Table */}
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      {selectedColumns.patientName && (
                        <th 
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => handleSort('patientname')}
                        >
                          Patient Name
                          {sortBy === 'patientname' && (
                            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </th>
                      )}
                      {selectedColumns.carrier && (
                        <th 
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => handleSort('insurancecarrier')}
                        >
                          Carrier
                          {sortBy === 'insurancecarrier' && (
                            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </th>
                      )}
                      {selectedColumns.offices && (
                        <th 
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => handleSort('offices')}
                        >
                          Office
                          {sortBy === 'offices' && (
                            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </th>
                      )}
                      {selectedColumns.dos && (
                        <th 
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => handleSort('dos')}
                        >
                          DOS
                          {sortBy === 'dos' && (
                            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </th>
                      )}
                      {selectedColumns.claimStatus && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Claim Status
                        </th>
                      )}
                      {selectedColumns.comments && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Comments
                        </th>
                      )}
                      {selectedColumns.email && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Email
                        </th>
                      )}
                      {selectedColumns.patientPortion && (
                        <th 
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => handleSort('paidamount')}
                        >
                          Patient Portion
                          {sortBy === 'paidamount' && (
                            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </th>
                      )}
                      {selectedColumns.eftCheckDate && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          EFT/Check Date
                        </th>
                      )}
                      {selectedColumns.status && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                      )}
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedData.map((record, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        {selectedColumns.patientName && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {record.patientname}
                            </div>
                          </td>
                        )}
                        {selectedColumns.carrier && (
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {record.insurancecarrier}
                          </td>
                        )}
                        {selectedColumns.offices && (
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {record.offices}
                          </td>
                        )}
                        {selectedColumns.dos && (
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {record.dos ? formatDate(record.dos) : 'N/A'}
                          </td>
                        )}
                        {selectedColumns.claimStatus && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(record.claimstatus)}`}>
                              {record.claimstatus}
                            </span>
                          </td>
                        )}
                        {selectedColumns.comments && (
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-xs">
                            <div className="truncate" title={record.commentsreasons}>
                              {record.commentsreasons || 'N/A'}
                            </div>
                          </td>
                        )}
                        {selectedColumns.email && (
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {record.emailaddress || 'N/A'}
                          </td>
                        )}
                        {selectedColumns.patientPortion && (
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(record.paidamount)}
                          </td>
                        )}
                        {selectedColumns.eftCheckDate && (
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {record.eftCheckIssuedDate ? formatDate(record.eftCheckIssuedDate) : 'N/A'}
                          </td>
                        )}
                        {selectedColumns.status && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(record.status)}`}>
                              {record.status || 'N/A'}
                            </span>
                          </td>
                        )}
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mr-2">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}

            {filteredData.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 dark:text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No records found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
