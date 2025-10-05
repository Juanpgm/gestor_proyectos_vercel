/**
 * Componente de Dashboard para Unidades de Proyecto
 * Implementa visualización de métricas con gráficos interactivos
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
  RadialBarChart, RadialBar
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  MapPin, 
  Building2, 
  Calendar,
  Activity,
  PieChart as PieChartIcon,
  BarChart3,
  Target
} from 'lucide-react';
import { type DashboardData } from '@/services/unidades-proyecto.service';

interface DashboardProps {
  data: DashboardData | null;
  isLoading?: boolean;
  className?: string;
}

// Colores para gráficos
const CHART_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
];

const RADIAL_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

// Componente para métricas numéricas
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}> = ({ title, value, change, icon, color, subtitle }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className={`p-3 rounded-lg bg-gradient-to-r ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      {change !== undefined && (
        <div className={`flex items-center space-x-1 ${
          change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        }`}>
          {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span className="text-sm font-medium">{Math.abs(change)}%</span>
        </div>
      )}
    </div>
  </motion.div>
);

// Componente para gráfico de barras
const BarChartCard: React.FC<{
  title: string;
  data: Array<{ name: string; value: number; percentage?: number }>;
  color?: string;
}> = ({ title, data, color = '#3B82F6' }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
  >
    <div className="flex items-center space-x-2 mb-4">
      <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
    </div>
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            className="text-gray-600 dark:text-gray-400"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            className="text-gray-600 dark:text-gray-400"
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: 'none',
              borderRadius: '8px',
              color: 'white'
            }}
            formatter={(value, name) => [value, 'Cantidad']}
          />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </motion.div>
);

// Componente para gráfico circular
const PieChartCard: React.FC<{
  title: string;
  data: Array<{ name: string; value: number }>;
}> = ({ title, data }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
  >
    <div className="flex items-center space-x-2 mb-4">
      <PieChartIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
    </div>
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: 'none',
              borderRadius: '8px',
              color: 'white'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  </motion.div>
);

// Componente para gráfico radial
const RadialChartCard: React.FC<{
  title: string;
  data: Array<{ name: string; value: number; fill: string }>;
}> = ({ title, data }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
  >
    <div className="flex items-center space-x-2 mb-4">
      <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
    </div>
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={data}>
          <RadialBar
            dataKey="value"
            cornerRadius={4}
            fill="#3B82F6"
          />
          <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
          <Tooltip />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  </motion.div>
);

// Utilidad para formatear números
const formatNumber = (num: number): string => {
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

// Utilidad para formatear moneda
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Componente principal del Dashboard
const UnidadesProyectoDashboard: React.FC<DashboardProps> = ({ 
  data, 
  isLoading = false, 
  className = '' 
}) => {
  // Procesar datos para gráficos
  const chartData = useMemo(() => {
    if (!data) return null;

    // Datos para gráfico de estados
    const estadosData = Object.entries(data.distribuciones.por_estado.conteos || {}).map(([name, value]) => ({
      name: name.length > 15 ? `${name.substring(0, 15)}...` : name,
      value,
      fullName: name
    }));

    // Datos para gráfico de tipos de intervención
    const tiposData = Object.entries(data.distribuciones.por_tipo_intervencion.conteos || {}).map(([name, value]) => ({
      name: name.length > 20 ? `${name.substring(0, 20)}...` : name,
      value,
      fullName: name
    }));

    // Datos para gráfico de centros gestores (top 10)
    const centrosData = Object.entries(data.distribuciones.por_centro_gestor.conteos || {})
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, value]) => ({
        name: name.length > 15 ? `${name.substring(0, 15)}...` : name,
        value,
        fullName: name
      }));

    // Datos para gráfico de comunas (top 10)
    const comunasData = Object.entries(data.distribuciones.por_comuna_corregimiento.conteos || {})
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, value]) => ({
        name: name.length > 12 ? `${name.substring(0, 12)}...` : name,
        value,
        fullName: name
      }));

    // Datos para gráfico radial (estados principales)
    const radialData = estadosData.slice(0, 4).map((item, index) => ({
      name: item.name,
      value: (item.value / data.resumen_general.total_proyectos) * 100,
      fill: RADIAL_COLORS[index]
    }));

    return {
      estados: estadosData,
      tipos: tiposData,
      centros: centrosData,
      comunas: comunasData,
      radial: radialData
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded-xl h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded-xl h-80" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || !chartData) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No hay datos disponibles para mostrar</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Proyectos"
          value={formatNumber(data.resumen_general.total_proyectos)}
          icon={<Building2 className="w-6 h-6 text-white" />}
          color="from-blue-500 to-blue-600"
          subtitle={`${data.resumen_general.con_atributos} con atributos`}
        />
        
        <MetricCard
          title="Proyectos Activos"
          value={formatNumber(data.kpis_negocio.proyectos_activos)}
          icon={<Activity className="w-6 h-6 text-white" />}
          color="from-green-500 to-green-600"
          subtitle={`${data.kpis_negocio.tasa_completitud.toFixed(1)}% completitud`}
        />
        
        <MetricCard
          title="Centros Gestores"
          value={data.kpis_negocio.centros_gestores_activos}
          icon={<MapPin className="w-6 h-6 text-white" />}
          color="from-purple-500 to-purple-600"
          subtitle="activos"
        />
        
        <MetricCard
          title="Cobertura Territorial"
          value={data.kpis_negocio.cobertura_territorial.comunas_corregimientos}
          icon={<Calendar className="w-6 h-6 text-white" />}
          color="from-orange-500 to-orange-600"
          subtitle="comunas/corregimientos"
        />
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChartCard
          title="Distribución por Estado"
          data={chartData.estados}
          color="#3B82F6"
        />
        
        <PieChartCard
          title="Tipos de Intervención"
          data={chartData.tipos}
        />
        
        <BarChartCard
          title="Top 10 Centros Gestores"
          data={chartData.centros}
          color="#10B981"
        />
        
        <BarChartCard
          title="Top 10 Comunas/Corregimientos"
          data={chartData.comunas}
          color="#F59E0B"
        />
      </div>

      {/* Gráfico radial para estados principales */}
      {chartData.radial.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RadialChartCard
            title="Estados Principales (%)"
            data={chartData.radial}
          />
          
          {/* Métricas adicionales de KPIs */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center space-x-2 mb-4">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">KPIs de Negocio</h3>
            </div>
            <div className="space-y-4">
              {Object.entries(data.kpis_negocio || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {typeof value === 'number' ? formatNumber(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default UnidadesProyectoDashboard;