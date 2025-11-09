/**
 * NotificationDemo
 * Componente de demostración para el sistema de notificaciones
 * Muestra cómo usar las notificaciones y permite probarlas
 */

'use client';

import React, { useState } from 'react';
import { notifyChange } from '@/utils/notificationTracker';
import { notificationService } from '@/services/notificationService';
import { 
  Plus, 
  Edit, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw 
} from 'lucide-react';

const NotificationDemo: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const generateDemoNotification = async (type: string) => {
    setLoading(true);
    
    try {
      switch (type) {
        case 'new_project':
          notifyChange.newProject(
            `Proyecto Demo ${Date.now()}`,
            `proj_${Date.now()}`
          );
          break;

        case 'new_unit':
          notifyChange.newUnit(
            `Unidad Demo ${Date.now()}`,
            `unit_${Date.now()}`,
            'Proyecto Demo'
          );
          break;

        case 'new_contract':
          notifyChange.newContract(
            `CT-${Date.now()}`,
            `cont_${Date.now()}`,
            Math.floor(Math.random() * 1000000000)
          );
          break;

        case 'new_activity':
          notifyChange.newActivity(
            `Actividad Demo ${Date.now()}`,
            `act_${Date.now()}`
          );
          break;

        case 'budget_update':
          notifyChange.budgetChange(
            'Proyecto de Infraestructura Vial',
            500000000,
            750000000
          );
          break;

        case 'status_change':
          notifyChange.statusChange(
            'Proyecto de Educación',
            'En Planificación',
            'En Ejecución',
            'proyecto'
          );
          break;

        case 'deadline_warning':
          notifyChange.deadlineWarning(
            'Contrato de Construcción',
            5,
            'Contrato'
          );
          break;

        case 'urgent_alert':
          notificationService.create({
            type: 'system',
            priority: 'urgent',
            title: '⚠️ Alerta Urgente',
            message: 'Se requiere atención inmediata en el sistema',
            category: 'sistema'
          });
          break;

        default:
          break;
      }
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const demoButtons = [
    {
      label: 'Nuevo Proyecto',
      icon: Plus,
      type: 'new_project',
      color: 'bg-blue-600 hover:bg-blue-700',
      description: 'Simula la creación de un nuevo proyecto'
    },
    {
      label: 'Nueva Unidad',
      icon: Plus,
      type: 'new_unit',
      color: 'bg-green-600 hover:bg-green-700',
      description: 'Simula la creación de una unidad de proyecto'
    },
    {
      label: 'Nuevo Contrato',
      icon: Plus,
      type: 'new_contract',
      color: 'bg-purple-600 hover:bg-purple-700',
      description: 'Simula el registro de un contrato'
    },
    {
      label: 'Nueva Actividad',
      icon: Plus,
      type: 'new_activity',
      color: 'bg-red-600 hover:bg-red-700',
      description: 'Simula el registro de una actividad'
    },
    {
      label: 'Cambio Presupuesto',
      icon: DollarSign,
      type: 'budget_update',
      color: 'bg-yellow-600 hover:bg-yellow-700',
      description: 'Simula una actualización presupuestal'
    },
    {
      label: 'Cambio de Estado',
      icon: CheckCircle,
      type: 'status_change',
      color: 'bg-indigo-600 hover:bg-indigo-700',
      description: 'Simula un cambio de estado'
    },
    {
      label: 'Alerta Vencimiento',
      icon: AlertTriangle,
      type: 'deadline_warning',
      color: 'bg-orange-600 hover:bg-orange-700',
      description: 'Simula una alerta de vencimiento'
    },
    {
      label: 'Alerta Urgente',
      icon: AlertTriangle,
      type: 'urgent_alert',
      color: 'bg-red-700 hover:bg-red-800',
      description: 'Simula una alerta urgente del sistema'
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <RefreshCw className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Sistema de Notificaciones
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Prueba el sistema generando notificaciones de ejemplo
            </p>
          </div>
        </div>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
            ℹ️ Instrucciones
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <li>• Haz clic en cualquier botón para generar una notificación de prueba</li>
            <li>• Las notificaciones aparecerán en el panel del icono de campana en el header</li>
            <li>• Las notificaciones se guardan automáticamente en localStorage</li>
            <li>• El sistema detecta automáticamente cambios en datos reales</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {demoButtons.map((button) => {
            const Icon = button.icon;
            return (
              <button
                key={button.type}
                onClick={() => generateDemoNotification(button.type)}
                disabled={loading}
                className={`${button.color} text-white p-4 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-5 h-5" />
                  <span className="font-semibold">{button.label}</span>
                </div>
                <p className="text-xs text-white/80 text-left">
                  {button.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            📝 Uso del Sistema
          </h3>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
              <p className="font-mono text-xs text-gray-600 dark:text-gray-400 mb-1">
                Importar notifyChange:
              </p>
              <code className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded block text-blue-600 dark:text-blue-400">
                {`import { notifyChange } from '@/utils/notificationTracker';`}
              </code>
            </div>

            <div className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
              <p className="font-mono text-xs text-gray-600 dark:text-gray-400 mb-1">
                Notificar nuevo registro:
              </p>
              <code className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded block text-blue-600 dark:text-blue-400">
                {`notifyChange.newProject('Mi Proyecto', 'proj_123');`}
              </code>
            </div>

            <div className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
              <p className="font-mono text-xs text-gray-600 dark:text-gray-400 mb-1">
                Notificar cambio de estado:
              </p>
              <code className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded block text-blue-600 dark:text-blue-400">
                {`notifyChange.statusChange('Proyecto', 'Inicio', 'Avanzado', 'proyecto');`}
              </code>
            </div>

            <div className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
              <p className="font-mono text-xs text-gray-600 dark:text-gray-400 mb-1">
                Hook para rastrear cambios automáticos:
              </p>
              <code className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded block text-blue-600 dark:text-blue-400">
                {`useDataChangeTracker({ proyectos, contratos, unidades });`}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDemo;
