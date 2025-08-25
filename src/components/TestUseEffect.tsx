'use client'

import React, { useState, useEffect } from 'react'

export default function TestUseEffect() {
  console.log('🧪 TestUseEffect component render')
  
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    console.log('🟢 ¡¡¡TEST useEffect EJECUTADO!!! count:', count)
    
    if (count === 0) {
      setCount(1)
    }
  }, [count])
  
  console.log('🧪 TestUseEffect retornando, count:', count)
  
  return (
    <div className="p-4 border border-green-500">
      <h3>Test UseEffect Component</h3>
      <p>Count: {count}</p>
      <p>Si ves este count en 1, significa que useEffect funciona</p>
    </div>
  )
}
