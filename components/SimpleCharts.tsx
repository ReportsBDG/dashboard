'use client'

import { useState } from 'react'
import {
  Plus,
  Settings,
  Eye,
  EyeOff,
  Trash2,
  BarChart3,
  LineChart as LineIcon,
  PieChart,
  Grid3x3,
  X
} from 'lucide-react'
import ChartConfigModal from './ChartConfigModal'

export default function SimpleCharts({ data }: { data: any[] }) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [currentChart, setCurrentChart] = useState<any>(null)
  const [charts, setCharts] = useState([
    {
      id: '1',
      title: 'Revenue by Office',
      type: 'bar',
      visible: true,
      showLegend: true,
      showGrid: true,
      xAxis: 'office',
      yAxis: ['amount'],
      aggregation: 'sum',
      colors: ['#0ea5e9']
    },
    {
      id: '2',
      title: 'Claims Distribution',
      type: 'pie',
      visible: true,
      showLegend: true,
      showGrid: false,
      xAxis: 'status',
      yAxis: ['amount'],
      aggregation: 'count',
      colors: ['#10b981', '#f59e0b', '#ef4444']
    }
  ])

  const updateChart = (id: string, updates: any) => {
    setCharts(charts.map(chart => 
      chart.id === id ? { ...chart, ...updates } : chart
    ))
  }

  const deleteChart = (id: string) => {
    setCharts(charts.filter(chart => chart.id !== id))
    setActiveDropdown(null)
  }

  const openConfiguration = (chart: any) => {
    setCurrentChart(chart)
    setShowConfigModal(true)
    setActiveDropdown(null)
  }

  const saveConfiguration = (config: any) => {
    if (currentChart) {
      setCharts(charts.map(chart =>
        chart.id === currentChart.id ? { ...chart, ...config } : chart
      ))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Interactive Charts
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Click the + button on each chart to see all options
        </p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {charts.filter(chart => chart.visible).map((chart) => (
          <div key={chart.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            {/* Chart Header with + Button */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {chart.title}
                </h3>
                
                {/* PROMINENT + BUTTON */}
                <div className="relative">
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === chart.id ? null : chart.id)}
                    className="flex items-center justify-center w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg border-2 border-white hover:scale-105 transition-all duration-200"
                    title="Chart Options"
                  >
                    <Plus className="w-6 h-6" />
                  </button>

                  {/* Dropdown Menu */}
                  {activeDropdown === chart.id && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-2xl z-50">
                      {/* Header */}
                      <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900 dark:text-white">Chart Options</h4>
                          <button
                            onClick={() => setActiveDropdown(null)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="py-2">
                        {/* 1. Chart Type */}
                        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                          <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                            1. Chart Type
                          </h5>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { type: 'bar', icon: BarChart3, label: 'Bar' },
                              { type: 'line', icon: LineIcon, label: 'Line' },
                              { type: 'pie', icon: PieChart, label: 'Pie' }
                            ].map(({ type, icon: Icon, label }) => (
                              <button
                                key={type}
                                onClick={() => updateChart(chart.id, { type })}
                                className={`p-2 rounded-lg border-2 transition-all ${
                                  chart.type === type
                                    ? 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-800 dark:text-blue-200'
                                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-600 dark:hover:bg-blue-900/20'
                                }`}
                              >
                                <Icon className="w-4 h-4 mx-auto mb-1" />
                                <div className="text-xs">{label}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 2. Legend Toggle */}
                        <button
                          onClick={() => updateChart(chart.id, { showLegend: !chart.showLegend })}
                          className="flex items-center w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          {chart.showLegend ? (
                            <EyeOff className="w-5 h-5 mr-3 text-orange-500" />
                          ) : (
                            <Eye className="w-5 h-5 mr-3 text-green-500" />
                          )}
                          <div className="text-left">
                            <div className="font-medium text-gray-900 dark:text-white">
                              2. {chart.showLegend ? 'Hide Legend' : 'Show Legend'}
                            </div>
                            <div className="text-xs text-gray-500">Toggle chart legend visibility</div>
                          </div>
                        </button>

                        {/* 3. Grid Lines */}
                        <button
                          onClick={() => updateChart(chart.id, { showGrid: !chart.showGrid })}
                          className="flex items-center w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Grid3x3 className="w-5 h-5 mr-3 text-purple-500" />
                          <div className="text-left">
                            <div className="font-medium text-gray-900 dark:text-white">
                              3. {chart.showGrid ? 'Hide Grid' : 'Show Grid'}
                            </div>
                            <div className="text-xs text-gray-500">Toggle grid lines</div>
                          </div>
                        </button>

                        {/* 4. Delete Chart */}
                        <button
                          onClick={() => deleteChart(chart.id)}
                          className="flex items-center w-full px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="w-5 h-5 mr-3" />
                          <div className="text-left">
                            <div className="font-medium">4. Delete Chart</div>
                            <div className="text-xs opacity-75">Remove this chart permanently</div>
                          </div>
                        </button>

                        {/* 5. Hide Chart */}
                        <button
                          onClick={() => {
                            updateChart(chart.id, { visible: false })
                            setActiveDropdown(null)
                          }}
                          className="flex items-center w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <EyeOff className="w-5 h-5 mr-3 text-gray-500" />
                          <div className="text-left">
                            <div className="font-medium text-gray-900 dark:text-white">5. Hide Chart</div>
                            <div className="text-xs text-gray-500">Hide this chart from view</div>
                          </div>
                        </button>

                        {/* 6. Configuration */}
                        <button
                          onClick={() => openConfiguration(chart)}
                          className="flex items-center w-full px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-t border-gray-200 dark:border-gray-700"
                        >
                          <Settings className="w-5 h-5 mr-3 text-blue-500" />
                          <div className="text-left">
                            <div className="font-medium text-gray-900 dark:text-white">6. Configuration</div>
                            <div className="text-xs text-gray-500">Pivot table settings & variables</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Chart Content */}
            <div className="p-6">
              <div className="h-64 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg flex items-center justify-center border-2 border-dashed border-blue-300 dark:border-blue-600">
                <div className="text-center">
                  {chart.type === 'bar' && <BarChart3 className="w-16 h-16 text-blue-500 mx-auto mb-2" />}
                  {chart.type === 'line' && <LineIcon className="w-16 h-16 text-blue-500 mx-auto mb-2" />}
                  {chart.type === 'pie' && <PieChart className="w-16 h-16 text-blue-500 mx-auto mb-2" />}
                  
                  <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {chart.title}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {chart.type.charAt(0).toUpperCase() + chart.type.slice(1)} Chart
                  </p>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                      <span>Legend: {chart.showLegend ? 'ON' : 'OFF'}</span>
                      <span>Grid: {chart.showGrid ? 'ON' : 'OFF'}</span>
                    </div>
                    <div className="text-xs text-gray-400 text-center">
                      X: {chart.xAxis || 'Not set'} | Y: {chart.yAxis?.join(', ') || 'Not set'} | Agg: {chart.aggregation || 'sum'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create New Chart Button */}
      <div className="text-center">
        <button
          onClick={() => {
            const newChart = {
              id: Date.now().toString(),
              title: `New Chart ${charts.length + 1}`,
              type: 'bar',
              visible: true,
              showLegend: true,
              showGrid: true
            }
            setCharts([...charts, newChart])
          }}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create New Chart
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">How to Use:</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Click the <strong>blue + button</strong> on any chart to see all options</li>
          <li>• Change chart type, toggle legend, show/hide grid lines</li>
          <li>• Delete or hide charts as needed</li>
          <li>• Use Configuration for advanced pivot table settings</li>
        </ul>
      </div>
    </div>
  )
}
