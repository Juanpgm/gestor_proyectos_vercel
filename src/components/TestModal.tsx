// Test del modal para verificar que funciona correctamente
// Este es un componente de prueba que puedes usar temporalmente

'use client'

import React, { useState } from 'react'
import AgregarProcesoModal from '../components/AgregarProcesoModal'

const TestModal = () => {
  const [showModal, setShowModal] = useState(false)

  const handleSuccess = () => {
    console.log('✅ Proceso agregado exitosamente')
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test del Modal Agregar Proceso</h1>
      
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Abrir Modal de Prueba
      </button>

      <div className="mt-4 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Instrucciones de prueba:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Haz clic en &quot;Abrir Modal de Prueba&quot;</li>
          <li>Verifica que puedes interactuar con el formulario</li>
          <li>Prueba hacer clic en el fondo gris (debería cerrar)</li>
          <li>Prueba presionar Escape (debería cerrar)</li>
          <li>Completa el formulario con datos de prueba</li>
        </ul>
      </div>

      <AgregarProcesoModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
      />
    </div>
  )
}

export default TestModal