'use client';

import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface ProjectProgressMetricsProps {
  data: any[];
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6B7280', '#8B5CF6'];

const ProjectProgressMetrics: React.FC<ProjectProgressMetricsProps> = ({ data }) => {
  const [selectedView, setSelectedView] = useState<'progress' | 'budget' | 'status'>('progress');

  const progressData = useMemo(() => {
    if (!data || data.length === 0) return { progressRanges: [], budgetRanges: [], statusCounts: [] };

    // Rangos de avance físico
    const progressRanges = [
      { name: '0%', count: 0, range: [0, 0] },
      { name: '1-25%', count: 0, range: [1, 25] },
      { name: '26-50%', count: 0, range: [26, 50] },
      { name: '51-75%', count: 0, range: [51, 75] },
      { name: '76-100%', count: 0, range: [76, 100] }
    ];

    // Rangos de ejecución presupuestal
    const budgetRanges = [
      { name: '0%', count: 0, range: [0, 0] },
      { name: '1-25%', count: 0, range: [1, 25] },
      { name: '26-50%', count: 0, range: [26, 50] },
      { name: '51-75%', count: 0, range: [51, 75] },
      { name: '76-100%', count: 0, range: [76, 100] }
    ];

    // Estados de proyecto
    const statusCounts: { [key: string]: number } = {};

    data.forEach(feature => {
      if (feature.properties) {
        const props = feature.properties;
        
        // Avance físico
        const physicalProgress = props.avance_físico_obra || 0;
        progressRanges.forEach(range => {
          if (physicalProgress >= range.range[0] && physicalProgress <= range.range[1]) {
            range.count++;
          }
        });

        // Ejecución financiera
        const financialProgress = props.ejecucion_financiera_obra || 0;
        budgetRanges.forEach(range => {
          if (financialProgress >= range.range[0] && financialProgress <= range.range[1]) {
            range.count++;
          }
        });

        // Estados
        const status = props.estado_unidad_proyecto || 'Sin definir';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      }
    });

    const statusData = Object.entries(statusCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      progressRanges: progressRanges.filter(r => r.count > 0),
      budgetRanges: budgetRanges.filter(r => r.count > 0),
      statusCounts: statusData
    };
  }, [data]);

  const summaryStats = useMemo(() => {
    if (!data || data.length === 0) return { avgPhysical: 0, avgFinancial: 0, totalBudget: 0, totalPayments: 0 };

    let totalPhysical = 0;
    let totalFinancial = 0;
    let totalBudget = 0;
    let totalPayments = 0;
    let validPhysical = 0;
    let validFinancial = 0;

    data.forEach(feature => {
      if (feature.properties) {
        const props = feature.properties;
        
        if (props.avance_físico_obra && props.avance_físico_obra > 0) {
          totalPhysical += props.avance_físico_obra;
          validPhysical++;
        }
        
        if (props.ejecucion_financiera_obra && props.ejecucion_financiera_obra > 0) {
          totalFinancial += props.ejecucion_financiera_obra;
          validFinancial++;
        }

        totalBudget += props.ppto_base || 0;
        totalPayments += props.pagos_realizados || 0;
      }
    });

    return {
      avgPhysical: validPhysical > 0 ? totalPhysical / validPhysical : 0,
      avgFinancial: validFinancial > 0 ? totalFinancial / validFinancial : 0,
      totalBudget,
      totalPayments
    };
  }, [data]);

  const getCurrentData = () => {
    switch (selectedView) {
      case 'progress':
        return progressData.progressRanges.map(item => ({ name: item.name, value: item.count }));
      case 'budget':
        return progressData.budgetRanges.map(item => ({ name: item.name, value: item.count }));
      case 'status':
        return progressData.statusCounts.map(item => ({ name: item.name, value: item.count }));
      default:
        return [];
    }
  };

  const getTitle = () => {
    switch (selectedView) {
      case 'progress':
        return 'Avance Físico';
      case 'budget':
        return 'Ejecución Financiera';
      case 'status':
        return 'Estado de Proyectos';
      default:
        return 'Progreso';
    }
  };

  const getIcon = () => {
    switch (selectedView) {
      case 'progress':
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
      case 'budget':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'status':
        return <Clock className="w-5 h-5 text-orange-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const currentData = getCurrentData();

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          {getIcon()}
          <span className="ml-2">{getTitle()}</span>
        </h3>
      </div>

      {/* View selector */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setSelectedView('progress')}
          className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
            selectedView === 'progress'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Avance Físico
        </button>
        <button
          onClick={() => setSelectedView('budget')}
          className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
            selectedView === 'budget'
              ? 'bg-white text-green-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Ejecución $
        </button>
        <button
          onClick={() => setSelectedView('status')}
          className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
            selectedView === 'status'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Estados
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-blue-50 rounded-lg p-2">
          <p className="text-blue-600 font-medium">Avance Físico Promedio</p>
          <p className="text-blue-800 font-bold text-lg">
            {summaryStats.avgPhysical.toFixed(1)}%
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-2">
          <p className="text-green-600 font-medium">Ejecución Financiera Promedio</p>
          <p className="text-green-800 font-bold text-lg">
            {summaryStats.avgFinancial.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        {currentData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={currentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${percent.toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {currentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any, name: any) => [
                  `${value} proyectos`,
                  'Cantidad'
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No hay datos de progreso disponibles</p>
          </div>
        )}
      </div>

      {/* Budget summary */}
      {selectedView === 'budget' && (
        <div className="border-t pt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Presupuesto Total:</span>
            <span className="font-bold text-gray-800">
              ${(summaryStats.totalBudget / 1000000).toFixed(1)}M
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Pagos Realizados:</span>
            <span className="font-bold text-green-600">
              ${(summaryStats.totalPayments / 1000000).toFixed(1)}M
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min(100, (summaryStats.totalPayments / summaryStats.totalBudget) * 100)}%` 
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectProgressMetrics;
