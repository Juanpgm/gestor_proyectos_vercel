'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'

interface MultiSelectProps {
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  label?: string
  maxHeight?: string
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selected,
  onChange,
  placeholder = 'Seleccionar...',
  label,
  maxHeight = '200px'
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option))
    } else {
      onChange([...selected, option])
    }
  }

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([])
  }

  const selectAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([...options])
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
          {label}
        </label>
      )}
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors flex items-center justify-between gap-2"
      >
        <span className="truncate text-left flex-1">
          {selected.length === 0 ? (
            <span className="text-slate-500 dark:text-slate-400">{placeholder}</span>
          ) : selected.length === 1 ? (
            selected[0]
          ) : (
            <span className="font-medium">{selected.length} seleccionado{selected.length !== 1 ? 's' : ''}</span>
          )}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {selected.length > 0 && (
            <button
              onClick={clearAll}
              className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
              title="Limpiar selección"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg overflow-hidden">
          {/* Select All / Clear All */}
          <div className="flex items-center justify-between p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
            <button
              onClick={selectAll}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Seleccionar todos
            </button>
            <button
              onClick={clearAll}
              className="text-xs text-slate-600 dark:text-slate-400 hover:underline"
            >
              Limpiar
            </button>
          </div>

          {/* Options List */}
          <div 
            className="overflow-y-auto"
            style={{ maxHeight }}
          >
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400 text-center">
                No hay opciones disponibles
              </div>
            ) : (
              options.map((option) => {
                const isSelected = selected.includes(option)
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleOption(option)}
                    className={`w-full px-3 py-2 text-sm text-left flex items-center justify-between gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <span className={`flex-1 ${isSelected ? 'font-medium text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-white'}`}>
                      {option}
                    </span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    )}
                  </button>
                )
              })
            )}
          </div>

          {/* Footer with count */}
          {selected.length > 0 && (
            <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {selected.length} de {options.length} seleccionado{selected.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
