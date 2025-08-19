'use client'

import React from 'react'

interface ReduxProviderProps {
  children: React.ReactNode
}

export const ReduxProvider: React.FC<ReduxProviderProps> = ({ children }) => {
  return <>{children}</>
}
