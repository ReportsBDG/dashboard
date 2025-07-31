import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = "https://script.google.com/macros/s/AKfycbz-hSsHHk5lcYtRc_XLC20hV24XneVFSLbrm-MuYnaJYqWHJZ75JjU1E6GtCe6oF6yQ/exec"
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error en proxy:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data from Google Sheets' }, 
      { status: 500 }
    )
  }
} 