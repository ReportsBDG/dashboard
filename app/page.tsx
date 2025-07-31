'use client'

import { useState, useEffect } from 'react'
import { 
  Activity, 
  DollarSign, 
  FileText, 
  Calculator, 
  Building, 
  Calendar, 
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
  ChevronDown,
  ChevronUp,
  Eye,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import SimpleCharts from '@/components/SimpleCharts'
import { dataService } from '@/services/dataService'
import { PatientRecord } from '@/types'

// Mock data for immediate display
const mockData = [
  {
    id: 1,
    patientName: 'John Smith',
    office: 'Downtown Dental',
    insurance: 'Delta Dental',
    amount: 850,
    status: 'Paid',
    type: 'Root Canal',
    date: '2024-01-15',
    email: 'john.smith@email.com'
  },
  {
    id: 2,
    patientName: 'Sarah Johnson',
    office: 'Westside Family Dental',
    insurance: 'BlueCross BlueShield',
    amount: 450,
    status: 'Pending',
    type: 'Cleaning',
    date: '2024-01-16',
    email: 'sarah.j@email.com'
  },
  {
    id: 3,
    patientName: 'Michael Brown',
    office: 'North Park Dental',
    insurance: 'Aetna',
    amount: 1200,
    status: 'Paid',
    type: 'Crown Placement',
    date: '2024-01-17',
    email: 'mbrown@email.com'
  },
  {
    id: 4,
    patientName: 'Emily Davis',
    office: 'Downtown Dental',
    insurance: 'Cigna',
    amount: 0,
    status: 'Denied',
    type: 'Whitening',
    date: '2024-01-18',
    email: 'emily.davis@email.com'
  },
  {
    id: 5,
    patientName: 'Robert Wilson',
    office: 'Eastside Dental',
    insurance: 'MetLife',
    amount: 650,
    status: 'Paid',
    type: 'Filling',
    date: '2024-01-19',
    email: 'rwilson@email.com'
  }
]

export default function DentalDashboard() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOffice, setSelectedOffice] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [isClient, setIsClient] = useState(false)
  const [data, setData] = useState<PatientRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load data from Google Sheets
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const patientData = await dataService.fetchPatientRecords()
        setData(patientData)
      } catch (err) {
        setError('Error al cargar datos de Google Sheets')
        console.error('Error loading data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Ensure consistent rendering between server and client
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Calculate metrics from real data
  const totalRevenue = data.reduce((sum, item) => sum + item.paidamount, 0)
  const claimsProcessed = data.length
  const averageClaim = claimsProcessed > 0 ? totalRevenue / claimsProcessed : 0
  const paidClaims = data.filter(item => item.claimstatus === 'Paid').length
  const pendingClaims = data.filter(item => item.claimstatus === 'Pending').length
  const deniedClaims = data.filter(item => item.claimstatus === 'Denied').length

  // Filter data based on search and filters
  const filteredData = data.filter(item => {
    const matchesSearch = item.patientname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.emailaddress && item.emailaddress.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesOffice = selectedOffice === 'all' || item.offices === selectedOffice
    const matchesStatus = selectedStatus === 'all' || item.claimstatus === selectedStatus
    return matchesSearch && matchesOffice && matchesStatus
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800 border-green-200'
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Denied': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString) => {
    if (!isClient) {
      // Return consistent format for server-side rendering
      return dateString
    }
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos de Google Sheets...</p>
        </div>
      </div>
    )
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">❌</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error de Conexión</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // Prevent hydration issues by showing loading state until client-side is ready
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Dental Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`} suppressHydrationWarning>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          {/* Top Row */}
          <div className="flex items-center justify-between mb-4">
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
              <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <Bell className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <RefreshCw className="w-5 h-5" />
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
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
                <span>+8.2% from last week</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Average Claim</p>
                  <p className="text-2xl font-bold">{formatCurrency(averageClaim)}</p>
                </div>
                <Calculator className="w-8 h-8 text-purple-200" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>+3.1% from last month</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Active Offices</p>
                  <p className="text-2xl font-bold">4</p>
                </div>
                <Building className="w-8 h-8 text-orange-200" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                <span className="text-orange-100">All systems operational</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-sm font-medium">Today's Claims</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <Calendar className="w-8 h-8 text-pink-200" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>+15.3% vs yesterday</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-200 text-sm font-medium">System Status</p>
                  <p className="text-xl font-bold">Operational</p>
                </div>
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center mt-2 text-sm">
                <span className="text-gray-200">99.9% uptime</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Filters */}
        <div className="w-80 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 h-screen">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
            </div>
          </div>

          <div className="p-4 space-y-6">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Global Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                <option value="Downtown Dental">Downtown Dental</option>
                <option value="Westside Family Dental">Westside Family Dental</option>
                <option value="North Park Dental">North Park Dental</option>
                <option value="Eastside Dental">Eastside Dental</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Claim Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Denied">Denied</option>
              </select>
            </div>

            {/* Status Summary */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Claim Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Paid Claims</span>
                  <span className="font-medium text-green-600">{paidClaims}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Pending Claims</span>
                  <span className="font-medium text-yellow-600">{pendingClaims}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Denied Claims</span>
                  <span className="font-medium text-red-600">{deniedClaims}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div className="text-sm font-medium text-green-600 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +12.5%
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase">Total Revenue</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalRevenue)}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">All-time revenue</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="text-sm font-medium text-green-600 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +8.2%
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase">Claims Processed</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{claimsProcessed}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total claims handled</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <Calculator className="w-6 h-6" />
                </div>
                <div className="text-sm font-medium text-green-600 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +3.1%
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase">Average Claim</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(averageClaim)}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Per claim average</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                  <Building className="w-6 h-6" />
                </div>
                <div className="text-sm font-medium text-gray-600 flex items-center">
                  0%
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase">Active Offices</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">4</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Currently operational</p>
            </div>
          </div>

          {/* Interactive Charts Section */}
          <SimpleCharts data={data} />

          {/* Patient Records Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Patient Records</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {filteredData.length} of {data.length} records
                  </p>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700">
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Office
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Insurance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredData.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {record.patientname}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {record.emailaddress || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {record.offices}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {record.insurancecarrier}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(record.paidamount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(record.claimstatus)}`}>
                          {record.claimstatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {record.typeofinteraction || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {record.timestamp ? formatDate(record.timestamp) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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
