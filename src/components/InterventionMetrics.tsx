'use client';

import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line, LineChart } from 'recharts';
import { BarChart3, PieChart as PieChartIcon, Filter, TrendingUp, Layers, Building2 } from 'lucide-react';

// Tipo para las unidades de proyecto que se pasan al componente
interface UnidadProyecto {
  id: string;
  bpin: string;
  name: string;
  status: string;
  budget: number;
  tipoIntervencion?: string;
  claseObra?: string;
  [key: string]: any;
}

interface InterventionMetricsProps {
  data: UnidadProyecto[];
}

const COLORS = [
  '#1E40AF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
];

const InterventionMetrics: React.FC<InterventionMetricsProps> = ({ data }) => {
  const [chartType, setChartType] = useState<'pie' | 'bar' | 'donut'>('donut');
  const [activeTab, setActiveTab] = useState<'tipos' | 'clases'>('tipos');

  // Procesar datos para Tipos de Intervención
  const tiposIntervencionData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const counts: { [key: string]: number } = {};
    const budgets: { [key: string]: number } = {};
    
    data.forEach(item => {
      // El dato ya viene procesado como UnidadProyecto desde useUnidadesProyecto
      const tipo = item.tipoIntervencion || 'Sin especificar';
      const budget = item.budget || 0;
      
      counts[tipo] = (counts[tipo] || 0) + 1;
      budgets[tipo] = (budgets[tipo] || 0) + budget;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ 
        name: name.length > 20 ? name.substring(0, 20) + '...' : name,
        fullName: name,
        count, 
        budget: budgets[name] || 0,
        percentage: ((count / data.length) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  // Procesar datos para Clases de Obra
  const clasesObraData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const counts: { [key: string]: number } = {};
    const budgets: { [key: string]: number } = {};
    
    data.forEach(item => {
      // El dato ya viene procesado como UnidadProyecto desde useUnidadesProyecto
      const clase = item.claseObra || 'Sin especificar';
      const budget = item.budget || 0;
      
      counts[clase] = (counts[clase] || 0) + 1;
      budgets[clase] = (budgets[clase] || 0) + budget;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ 
        name: name.length > 20 ? name.substring(0, 20) + '...' : name,
        fullName: name,
        count, 
        budget: budgets[name] || 0,
        percentage: ((count / data.length) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  const totalProjects = data?.length || 0;
  const currentData = activeTab === 'tipos' ? tiposIntervencionData : clasesObraData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-white">{data.fullName}</p>
          <p className="text-blue-600 dark:text-blue-400">
            Proyectos: <span className="font-bold">{data.count}</span>
          </p>
          <p className="text-green-600 dark:text-green-400">
            Presupuesto: <span className="font-bold">{formatCurrency(data.budget)}</span>
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Porcentaje: <span className="font-bold">{data.percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (!currentData || currentData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-xs">
              {data.length === 0 ? 'Cargando datos...' : 'No hay datos disponibles'}
            </p>
            {data.length > 0 && (
              <p className="text-xs mt-1">
                {activeTab === 'tipos' ? 'Sin tipos de intervención' : 'Sin clases de obra'}
              </p>
            )}
          </div>
        </div>
      );
    }

    switch (chartType) {
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={currentData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ percentage }) => `${percentage}%`}
              outerRadius={60}
              fill="#8884d8"
              dataKey="count"
            >
              {currentData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        );
      
      case 'donut':
        return (
          <PieChart>
            <Pie
              data={currentData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ percentage }) => `${percentage}%`}
              outerRadius={60}
              innerRadius={25}
              fill="#8884d8"
              dataKey="count"
            >
              {currentData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-gray-600 dark:fill-gray-300 text-xs font-medium">
              {totalProjects}
            </text>
            <text x="50%" y="50%" dy="12" textAnchor="middle" dominantBaseline="middle" className="fill-gray-500 dark:fill-gray-400 text-xs">
              Total
            </text>
          </PieChart>
        );
      
      case 'bar':
        return (
          <BarChart data={currentData.slice(0, 6)} margin={{ top: 5, right: 10, left: 5, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={60}
              fontSize={9}
              tick={{ fontSize: 9 }}
            />
            <YAxis fontSize={9} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill="#1E40AF" radius={[2, 2, 0, 0]} />
          </BarChart>
        );
      
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500 dark:text-gray-400">Seleccione un tipo de gráfico</div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-3">
      {/* Header con tabs */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('tipos')}
            className={`px-2 py-1 text-xs rounded transition-colors flex items-center space-x-1 ${
              activeTab === 'tipos'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <TrendingUp className="w-3 h-3" />
            <span>Tipos</span>
          </button>
          <button
            onClick={() => setActiveTab('clases')}
            className={`px-2 py-1 text-xs rounded transition-colors flex items-center space-x-1 ${
              activeTab === 'clases'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Building2 className="w-3 h-3" />
            <span>Clases</span>
          </button>
        </div>
        
        <div className="flex space-x-1">
          <button
            onClick={() => setChartType('donut')}
            className={`p-1 rounded transition-colors ${
              chartType === 'donut' 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Gráfico de dona"
          >
            <div className="w-3 h-3 border-2 border-current rounded-full relative">
              <div className="absolute inset-1 bg-current rounded-full"></div>
            </div>
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`p-1 rounded transition-colors ${
              chartType === 'pie' 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Gráfico circular"
          >
            <PieChartIcon className="w-3 h-3" />
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`p-1 rounded transition-colors ${
              chartType === 'bar' 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Gráfico de barras"
          >
            <BarChart3 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Gráfico principal */}
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Lista de elementos con métricas */}
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {currentData.slice(0, 6).map((item, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-xs">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <div 
                className="w-2 h-2 rounded-full flex-shrink-0" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="flex-1 font-medium text-gray-700 dark:text-gray-300 break-words" title={item.fullName}>
                {item.name}
              </span>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <div className="font-bold text-gray-900 dark:text-white">{item.count}</div>
              <div className="text-gray-500 dark:text-gray-400">{item.percentage}%</div>
            </div>
          </div>
        ))}
      </div>

      {/* Resumen estadístico compacto */}
      <div className="grid grid-cols-3 gap-1 text-xs">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-1.5 text-center">
          <div className="font-bold text-blue-700 dark:text-blue-300">{currentData.length}</div>
          <div className="text-blue-600 dark:text-blue-400">Categorías</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded p-1.5 text-center">
          <div className="font-bold text-green-700 dark:text-green-300">{totalProjects}</div>
          <div className="text-green-600 dark:text-green-400">Proyectos</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded p-1.5 text-center">
          <div className="font-bold text-purple-700 dark:text-purple-300">
            {currentData.length > 0 ? currentData[0].name : 'N/A'}
          </div>
          <div className="text-purple-600 dark:text-purple-400">Principal</div>
        </div>
      </div>
    </div>
  );
};

export default InterventionMetrics;
