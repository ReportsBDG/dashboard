'use client'

import { useState } from 'react'
import { fetchFromGoogleScript } from '@/lib/google-script'

export default function TestConnectionPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testDirectConnection = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    
    try {
      console.log('Probando conexión directa...')
      const response = await fetch('https://script.google.com/macros/s/AKfycbz-hSsHHk5lcYtRc_XLC20hV24XneVFSLbrm-MuYnaJYqWHJZ75JjU1E6GtCe6oF6yQ/exec')
      console.log('Status:', response.status)
      console.log('Headers:', response.headers)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setResult({ type: 'Direct Connection', data, count: data.data?.length || data.length || 0 })
    } catch (err) {
      setError(`Error directo: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const testProxyConnection = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    
    try {
      console.log('Probando conexión por proxy...')
      const response = await fetch('/api/proxy')
      console.log('Proxy Status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setResult({ type: 'Proxy Connection', data, count: data.data?.length || data.length || 0 })
    } catch (err) {
      setError(`Error proxy: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const testGoogleScriptFunction = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    
    try {
      console.log('Probando función fetchFromGoogleScript...')
      const data = await fetchFromGoogleScript()
      setResult({ type: 'Google Script Function', data, count: data.length })
    } catch (err) {
      setError(`Error función: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const testWithParameters = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    
    try {
      console.log('Probando con parámetros...')
      const response = await fetch('/api/proxy?action=getAllRecords&limit=1000&sheet=Sheet1')
      console.log('Parameters Status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setResult({ type: 'With Parameters', data, count: data.data?.length || data.length || 0 })
    } catch (err) {
      setError(`Error parámetros: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const testSheetInfo = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    
    try {
      console.log('Probando información de la hoja...')
      const response = await fetch('/api/proxy?action=getSheetInfo')
      console.log('Sheet Info Status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setResult({ type: 'Sheet Information', data })
    } catch (err) {
      setError(`Error info hoja: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🔧 Test de Conexión Google Sheets
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Diagnóstico de Conexión</h2>
          
          <div className="space-y-4">
            <button
              onClick={testDirectConnection}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Probando...' : '1. Test Conexión Directa'}
            </button>
            
            <button
              onClick={testProxyConnection}
              disabled={loading}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Probando...' : '2. Test Conexión por Proxy'}
            </button>
            
            <button
              onClick={testGoogleScriptFunction}
              disabled={loading}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Probando...' : '3. Test Función fetchFromGoogleScript'}
            </button>

            <button
              onClick={testWithParameters}
              disabled={loading}
              className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? 'Probando...' : '4. Test con Parámetros (limit=1000)'}
            </button>

            <button
              onClick={testSheetInfo}
              disabled={loading}
              className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Probando...' : '5. Test Información de la Hoja'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold mb-2">❌ Error:</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="text-green-800 font-semibold mb-2">
              ✅ Resultado ({result.type}): {result.count ? `${result.count} registros` : ''}
            </h3>
            <pre className="bg-white p-4 rounded border overflow-auto max-h-96 text-sm">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="text-yellow-800 font-semibold mb-2">📋 Información del Script:</h3>
          <ul className="text-yellow-700 space-y-1">
            <li>• <strong>ID del Script:</strong> AKfycbz-hSsHHk5lcYtRc_XLC20hV24XneVFSLbrm-MuYnaJYqWHJZ75JjU1E6GtCe6oF6yQ</li>
            <li>• <strong>URL:</strong> https://script.google.com/macros/s/AKfycbz-hSsHHk5lcYtRc_XLC20hV24XneVFSLbrm-MuYnaJYqWHJZ75JjU1E6GtCe6oF6yQ/exec</li>
            <li>• <strong>Registros esperados:</strong> 248</li>
            <li>• <strong>Registros obtenidos:</strong> 147</li>
            <li>• <strong>Registros faltantes:</strong> 101</li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-blue-800 font-semibold mb-2">🔍 Posibles Causas:</h3>
          <ul className="text-blue-700 space-y-1">
            <li>• <strong>Límite de filas:</strong> Google Apps Script puede tener un límite por defecto</li>
            <li>• <strong>Filtros:</strong> Puede haber filtros aplicados en la consulta</li>
            <li>• <strong>Hoja incorrecta:</strong> Los datos pueden estar en otra hoja</li>
            <li>• <strong>Rango limitado:</strong> El rango de lectura puede estar limitado</li>
            <li>• <strong>Datos ocultos:</strong> Algunas filas pueden estar ocultas o filtradas</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 