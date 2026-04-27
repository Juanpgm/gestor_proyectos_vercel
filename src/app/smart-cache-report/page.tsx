import SmartCacheReport from '../../components/SmartCacheReport'

export default function SmartCacheReportPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Sistema de Cache Inteligente
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitoreo y optimización de llamadas API con horarios programados
          </p>
        </div>
        
        <SmartCacheReport />
        
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            📋 Instrucciones de Uso
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2">🕐 Horarios de API</h3>
              <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                <li>• <strong>05:00</strong> - Primera actualización del día</li>
                <li>• <strong>12:00</strong> - Actualización del mediodía</li>
                <li>• <strong>16:00</strong> - Actualización de la tarde</li>
                <li>• <strong>20:00</strong> - Última actualización del día</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2">💡 Cómo Funciona</h3>
              <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                <li>• Solo hace llamadas API en horarios específicos</li>
                <li>• Usa cache de 4 horas para servir datos</li>
                <li>• Fallback automático a datos offline</li>
                <li>• Reduce costos en ~83% vs llamadas por hora</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2">⚙️ Configuración</h3>
              <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                <li>• <strong>NEXT_PUBLIC_API_URL:</strong> URL del backend</li>
                <li>• <strong>NEXT_PUBLIC_DATA_MODE:</strong> &apos;api&apos; o &apos;offline&apos;</li>
                <li>• Cache automático con timestamps</li>
                <li>• Reintentos automáticos en fallos</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2">📊 Beneficios</h3>
              <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                <li>• <strong>Reducción de costos:</strong> Solo 4 llamadas/día</li>
                <li>• <strong>Mejor rendimiento:</strong> Respuesta instantánea</li>
                <li>• <strong>Alta disponibilidad:</strong> Datos 24/7</li>
                <li>• <strong>Tolerancia a fallos:</strong> Múltiples fallbacks</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}