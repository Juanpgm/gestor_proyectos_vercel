'use client'

import { useState, useEffect } from 'react'

// Simple test hook to verify data loading works
export function useTestDataLoader() {
  const [testData, setTestData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('🧪 TEST HOOK: useEffect is running!')
    console.log('🧪 TEST HOOK: window available:', typeof window !== 'undefined')
    
    if (typeof window === 'undefined') {
      console.log('🧪 TEST HOOK: Server side, skipping...')
      return
    }

    console.log('🧪 TEST HOOK: Client side, loading data...')
    
    // Simple fetch test
    Promise.resolve(new Response('{"features":[]}')) // equipamientos eliminado
      .then(response => {
        console.log('🧪 TEST HOOK: Response received:', response.status)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        return response.json()
      })
      .then(data => {
        console.log('🧪 TEST HOOK: Data loaded successfully!')
        console.log('🧪 TEST HOOK: Features count:', data.features?.length || 0)
        setTestData(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('🧪 TEST HOOK: Error loading data:', err)
        setError(err.message)
        setLoading(false)
      })
  }, [])

  console.log('🧪 TEST HOOK: Returning state:', { loading, error, hasData: !!testData })

  return { testData, loading, error }
}
