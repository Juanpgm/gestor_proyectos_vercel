'use client'

import { useState, useEffect } from 'react'

export function useUnidadesProyectoSimple() {
  console.log('🟢 SIMPLE HOOK: Iniciando')
  
  const [data, setData] = useState({ loading: true, error: null, count: 0 })
  
  console.log('🟢 SIMPLE HOOK: useState configurado')
  
  useEffect(() => {
    console.log('🟢 SIMPLE HOOK: useEffect EJECUTADO!')
    
    const timer = setTimeout(() => {
      console.log('🟢 SIMPLE HOOK: Timer ejecutado, actualizando datos')
      setData({ loading: false, error: null, count: 42 })
    }, 1000)
    
    return () => {
      console.log('🟢 SIMPLE HOOK: Cleanup ejecutado')
      clearTimeout(timer)
    }
  }, [])
  
  console.log('🟢 SIMPLE HOOK: Retornando estado:', data)
  
  return data
}
