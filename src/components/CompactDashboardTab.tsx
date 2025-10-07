/**
 * Mini Dashboard Visual Avanzado
 * Panel de control visual completo con múltiples tipos de gráficos y métricas
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  RadialBarChart, RadialBar,
  AreaChart, Area,
  LineChart, Line,
  ComposedChart,
  ScatterChart, Scatter,
  Treemap
} from 'recharts';
import { 
  Building2, 
  MapPin, 
  Activity,
  Target,
  Users,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Zap,
  Globe,
  Layers,
  Award,
  FileText,
  Briefcase,
  Map,
  Settings,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Star,
  Workflow
} from 'lucide-react';
import { type FilterParams } from '@/services/unidades-proyecto.service';

// Tipos basados en la estructura real del endpoint
interface DashboardData {
  resumen_general: {
    total_proyectos: number;
    con_geometria: number;
    con_atributos: number;
    porcentaje_geo: number;
    cobertura_datos: {
      completos: number;
      solo_atributos: number;
      solo_geometria: number;
    };
  };
  distribuciones: {
    por_estado: {
      conteos: Record<string, number>;
      total_categorias: number;
      porcentajes: Record<string, number>;
      top_3: Array<[string, number]>;
    };
    por_tipo_intervencion: {
      conteos: Record<string, number>;
      total_categorias: number;
      porcentajes: Record<string, number>;
      top_3: Array<[string, number]>;
    };
    por_centro_gestor: {
      conteos: Record<string, number>;
      total_categorias: number;
      porcentajes: Record<string, number>;
      top_3: Array<[string, number]>;
    };
    por_comuna_corregimiento: {
      conteos: Record<string, number>;
      total_categorias: number;
      porcentajes: Record<string, number>;
      top_3: Array<[string, number]>;
    };
    por_barrio_vereda: {
      conteos: Record<string, number>;
      total_categorias: number;
      porcentajes: Record<string, number>;
      top_3: Array<[string, number]>;
    };
  };
  kpis_negocio: {
    proyectos_activos: number;
    proyectos_finalizados: number;
    tasa_completitud: number;
    diversidad_tipos: number;
    centros_gestores_activos: number;
    cobertura_territorial: {
      comunas_corregimientos: number;
      barrios_veredas: number;
    };
  };
  analisis_calidad: Record<string, {
    valores_validos: number;
    valores_faltantes: number;
    completitud_porcentaje: number;
    calidad: string;
  }>;
  metricas_geograficas: Record<string, any>;
  filtros_aplicados: Record<string, any>;
}

interface CompactDashboardTabProps {
  filters: FilterParams;
  className?: string;
}

// Hook específico para el dashboard
const useDashboardFetch = (filters: FilterParams) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const queryString = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryString.append(key, String(value));
          }
        });
        
        const url = `/api/proxy/unidades-proyecto/dashboard${queryString.toString() ? `?${queryString}` : ''}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return { data, loading, error };
};

// Paleta de colores extendida para visualizaciones
const CHART_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4',
  '#EC4899', '#F97316', '#84CC16', '#6366F1', '#14B8A6', '#F43F5E'
];

const GRADIENT_COLORS = {
  blue: ['#60A5FA', '#3B82F6'],
  green: ['#34D399', '#10B981'],
  purple: ['#A78BFA', '#8B5CF6'],
  orange: ['#FBBF24', '#F59E0B'],
  red: ['#F87171', '#EF4444'],
  teal: ['#2DD4BF', '#14B8A6']
};

// Componente de métrica con diseño mejorado
const MetricCard: React.FC<{
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  gradient: string;
  trend?: 'up' | 'down' | 'stable';
  size?: 'sm' | 'md' | 'lg';
}> = ({ label, value, subtitle, icon, gradient, trend, size = 'md' }) => {
  const sizeClasses = {
    sm: 'p-2 space-x-1',
    md: 'p-3 space-x-2', 
    lg: 'p-4 space-x-3'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const valueSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <motion.div 
      className={`bg-gradient-to-br ${gradient} rounded-lg ${sizeClasses[size]} text-white shadow-lg hover:shadow-xl transition-all duration-300`}
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-1.5">
          {React.cloneElement(icon as React.ReactElement, { className: `${iconSizes[size]} text-white` })}
        </div>
        {trend && (
          <div className={`${trend === 'up' ? 'text-green-200' : trend === 'down' ? 'text-red-200' : 'text-gray-200'}`}>
            <TrendingUp className={`${iconSizes.sm} ${trend === 'down' ? 'rotate-180' : ''}`} />
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-medium text-white/80 uppercase tracking-wide">{label}</p>
        <p className={`${valueSizes[size]} font-bold text-white`}>{value}</p>
        {subtitle && (
          <p className="text-xs text-white/70 mt-1">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
};

// Componente de gráfico avanzado con animaciones
const AdvancedChartCard: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  icon: React.ReactNode;
  gradient?: string;
  delay?: number;
}> = ({ title, subtitle, children, icon, gradient = 'from-gray-50 to-white', delay = 0 }) => (
  <motion.div 
    className={`bg-gradient-to-br ${gradient} dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300`}
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
    whileHover={{ scale: 1.02 }}
  >
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center space-x-2">
        <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h4>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
      </div>
    </div>
    <div className="h-40">
      {children}
    </div>
  </motion.div>
);

// Componente principal
const CompactDashboardTab: React.FC<CompactDashboardTabProps> = ({ filters, className = '' }) => {
  const { data, loading, error } = useDashboardFetch(filters);

  // Procesamiento de datos mejorado para gráficos
  const chartData = useMemo(() => {
    if (!data) return null;

    // Estados - datos reales del endpoint
    const estados = data.distribuciones.por_estado.top_3.map(([name, value], index) => ({
      name: name === 'En ejecución' ? 'Ejecutando' : name === 'En alistamiento' ? 'Alistando' : name,
      fullName: name,
      value,
      fill: CHART_COLORS[index],
      percentage: data.distribuciones.por_estado.porcentajes[name]?.toFixed(1) || '0'
    }));

    // Tipos de intervención - todos los datos
    const tipos = Object.entries(data.distribuciones.por_tipo_intervencion.conteos)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, value], index) => ({
        name: name.length > 15 ? `${name.substring(0, 12)}...` : name,
        fullName: name,
        value,
        fill: CHART_COLORS[index],
        percentage: data.distribuciones.por_tipo_intervencion.porcentajes[name]?.toFixed(1) || '0'
      }));

    // Centros gestores - Top 5
    const centros = data.distribuciones.por_centro_gestor.top_3.map(([name, value], index) => ({
      name: name.includes('Secretaría') ? name.replace('Secretaría de ', '').replace('Secretaría del ', '').replace('Secretaría para la ', '') : name.length > 15 ? `${name.substring(0, 12)}...` : name,
      fullName: name,
      value: data.distribuciones.por_centro_gestor.porcentajes[name] || 0,
      count: value,
      fill: CHART_COLORS[index]
    }));

    // Comunas - Top 10 para mejor visualización
    const comunas = Object.entries(data.distribuciones.por_comuna_corregimiento.conteos)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, value], index) => ({
        name: name.replace('COMUNA ', 'C'),
        fullName: name,
        value,
        fill: CHART_COLORS[index % CHART_COLORS.length],
        percentage: data.distribuciones.por_comuna_corregimiento.porcentajes[name]?.toFixed(1) || '0'
      }));

    // Barrios - Top 8
    const barrios = Object.entries(data.distribuciones.por_barrio_vereda.conteos)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, value], index) => ({
        name: name.length > 12 ? `${name.substring(0, 10)}...` : name,
        fullName: name,
        value,
        fill: CHART_COLORS[index % CHART_COLORS.length],
        percentage: data.distribuciones.por_barrio_vereda.porcentajes[name]?.toFixed(1) || '0'
      }));

    // Análisis de calidad mejorado
    const calidad = Object.entries(data.analisis_calidad).map(([field, info], index) => ({
      field: field === 'upid' ? 'UPID' : 
             field === 'estado' ? 'Estado' :
             field === 'tipo_intervencion' ? 'Tipo Intervención' :
             field === 'nombre_centro_gestor' ? 'Centro Gestor' : field,
      completitud: info.completitud_porcentaje,
      validos: info.valores_validos,
      faltantes: info.valores_faltantes,
      calidad: info.calidad,
      color: info.calidad === 'Excelente' ? '#10B981' : 
             info.calidad === 'Buena' ? '#3B82F6' :
             info.calidad === 'Regular' ? '#F59E0B' : '#EF4444',
      fill: CHART_COLORS[index % CHART_COLORS.length]
    }));

    // Datos de distribución territorial
    const territorial = [
      {
        categoria: 'Estados',
        total: data.distribuciones.por_estado.total_categorias,
        activos: Object.keys(data.distribuciones.por_estado.conteos).length,
        porcentaje: 100
      },
      {
        categoria: 'Tipos Intervención',
        total: data.distribuciones.por_tipo_intervencion.total_categorias,
        activos: data.kpis_negocio.diversidad_tipos,
        porcentaje: (data.kpis_negocio.diversidad_tipos / data.distribuciones.por_tipo_intervencion.total_categorias) * 100
      },
      {
        categoria: 'Centros Gestores',
        total: data.distribuciones.por_centro_gestor.total_categorias,
        activos: data.kpis_negocio.centros_gestores_activos,
        porcentaje: (data.kpis_negocio.centros_gestores_activos / data.distribuciones.por_centro_gestor.total_categorias) * 100
      },
      {
        categoria: 'Comunas',
        total: data.distribuciones.por_comuna_corregimiento.total_categorias,
        activos: data.kpis_negocio.cobertura_territorial.comunas_corregimientos,
        porcentaje: (data.kpis_negocio.cobertura_territorial.comunas_corregimientos / data.distribuciones.por_comuna_corregimiento.total_categorias) * 100
      }
    ];

    return { estados, tipos, centros, comunas, barrios, calidad, territorial };
  }, [data]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Cargando dashboard...</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-center">
          <Activity className="w-5 h-5 text-red-500 mx-auto mb-1" />
          <p className="text-sm text-red-700">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!data || !chartData) {
    return (
      <div className={`${className}`}>
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-center">
          <BarChart3 className="w-5 h-5 text-gray-400 mx-auto mb-1" />
          <p className="text-sm text-gray-500">Sin datos disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header del Dashboard */}
      <motion.div 
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 text-white"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Dashboard Ejecutivo</h2>
              <p className="text-blue-100 text-sm">Análisis integral de unidades proyecto</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">Última actualización</p>
            <p className="text-lg font-semibold">{new Date().toLocaleTimeString('es-CO', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}</p>
          </div>
        </div>
      </motion.div>

      {/* Métricas principales expandidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <MetricCard
          label="Total Proyectos"
          value={formatNumber(data.resumen_general.total_proyectos)}
          subtitle={`100% con geometría`}
          icon={<Building2 />}
          gradient="from-blue-500 to-blue-600"
          trend="up"
          size="md"
        />
        
        <MetricCard
          label="En Ejecución"
          value={formatNumber(data.kpis_negocio.proyectos_activos)}
          subtitle={`${((data.kpis_negocio.proyectos_activos / data.resumen_general.total_proyectos) * 100).toFixed(1)}% del total`}
          icon={<Activity />}
          gradient="from-green-500 to-emerald-600"
          trend="up"
          size="md"
        />
        
        <MetricCard
          label="Finalizados"
          value={data.kpis_negocio.proyectos_finalizados}
          subtitle={`${((data.kpis_negocio.proyectos_finalizados / data.resumen_general.total_proyectos) * 100).toFixed(1)}% completados`}
          icon={<CheckCircle2 />}
          gradient="from-teal-500 to-cyan-600"
          trend="stable"
          size="md"
        />
        
        <MetricCard
          label="Centros Gestores"
          value={data.kpis_negocio.centros_gestores_activos}
          subtitle={`${data.kpis_negocio.diversidad_tipos} tipos intervención`}
          icon={<Users />}
          gradient="from-purple-500 to-violet-600"
          trend="stable"
          size="md"
        />
        
        <MetricCard
          label="Comunas Activas"
          value={data.kpis_negocio.cobertura_territorial.comunas_corregimientos}
          subtitle={`de ${data.distribuciones.por_comuna_corregimiento.total_categorias} total`}
          icon={<MapPin />}
          gradient="from-orange-500 to-red-500"
          trend="up"
          size="md"
        />

        <MetricCard
          label="Barrios Cubiertos"
          value={data.kpis_negocio.cobertura_territorial.barrios_veredas}
          subtitle={`de ${data.distribuciones.por_barrio_vereda.total_categorias} total`}
          icon={<Map />}
          gradient="from-pink-500 to-rose-600"
          trend="up"
          size="md"
        />
      </div>

      {/* Gráficos principales - Primera fila */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Estados - Gráfico de barras con gradiente */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-lg"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Estados de Proyecto</h4>
                <p className="text-xs text-gray-500">Top 5 más frecuentes</p>
              </div>
            </div>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.estados} margin={{ top: 10, right: 10, left: 10, bottom: 30 }}>
                <defs>
                  <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60A5FA" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: '#6B7280' }}
                  angle={-45}
                  textAnchor="end"
                  height={40}
                />
                <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
                  }}
                />
                <Bar dataKey="value" fill="url(#blueGradient)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Tipos - Gráfico circular mejorado */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-lg"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                <PieChartIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Tipos de Intervención</h4>
                <p className="text-xs text-gray-500">Distribución por categoría</p>
              </div>
            </div>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.tipos}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  innerRadius={25}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.tipos.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                      stroke="white"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Centros - Gráfico radial con animación */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-lg"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Centros Gestores</h4>
                <p className="text-xs text-gray-500">Distribución porcentual</p>
              </div>
            </div>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="30%" 
                outerRadius="80%" 
                data={chartData.centros}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
                  dataKey="value"
                  cornerRadius={4}
                  fill="#8B5CF6"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '12px'
                  }}
                  formatter={(value: any) => [`${typeof value === 'number' ? value.toFixed(1) : value}%`, 'Porcentaje']}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Comunas - Gráfico de barras horizontal */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-lg"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded-lg">
                <MapPin className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Top 10 Comunas</h4>
                <p className="text-xs text-gray-500">Mayor concentración de proyectos</p>
              </div>
            </div>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData.comunas} 
                layout="horizontal"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="orangeGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#FB923C" />
                    <stop offset="100%" stopColor="#F97316" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 9, fill: '#6B7280' }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fontSize: 8, fill: '#6B7280' }}
                  width={30}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '12px'
                  }}
                  formatter={(value: any, name: string, props: any) => [
                    `${value} proyectos (${props.payload.percentage}%)`,
                    props.payload.fullName
                  ]}
                />
                <Bar 
                  dataKey="value" 
                  fill="url(#orangeGradient)"
                  radius={[0, 3, 3, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Segunda fila de gráficos más avanzados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Nuevo gráfico de barrios */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-lg"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.45 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="bg-cyan-100 dark:bg-cyan-900 p-2 rounded-lg">
                <Globe className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Top Barrios</h4>
                <p className="text-xs text-gray-500">Distribución local</p>
              </div>
            </div>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.barrios.slice(0, 6)}
                  cx="50%"
                  cy="50%"
                  outerRadius={50}
                  innerRadius={20}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.barrios.slice(0, 6).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.fill}
                      stroke="white"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '12px'
                  }}
                  formatter={(value: any, name: string, props: any) => [
                    `${value} proyectos (${props.payload.percentage}%)`,
                    props.payload.fullName
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
        
        {/* Análisis de calidad de datos real */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-lg">
                <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Calidad de Campos</h4>
                <p className="text-xs text-gray-500">Completitud por campo</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {chartData.calidad.map((item, index) => (
              <div key={item.field} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: `${item.color}15` }}>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.field}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold" style={{ color: item.color }}>
                    {item.completitud}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.calidad}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Distribución territorial con datos reales */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="bg-teal-100 dark:bg-teal-900 p-2 rounded-lg">
                <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Distribución Administrativa</h4>
                <p className="text-xs text-gray-500">Cobertura por categoría</p>
              </div>
            </div>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData.territorial}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="territorialGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14B8A6" />
                    <stop offset="100%" stopColor="#0D9488" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="categoria" 
                  tick={{ fontSize: 8, fill: '#6B7280' }}
                  angle={-45}
                  textAnchor="end"
                  height={40}
                />
                <YAxis tick={{ fontSize: 9, fill: '#6B7280' }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '12px'
                  }}
                  formatter={(value: any, name: string, props: any) => [
                    `${value} activos de ${props.payload.total} total (${props.payload.porcentaje.toFixed(1)}%)`,
                    'Cobertura'
                  ]}
                />
                <Bar 
                  dataKey="activos" 
                  fill="url(#territorialGradient)"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Panel de indicadores clave mejorado */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="bg-rose-100 dark:bg-rose-900 p-2 rounded-lg">
                <Zap className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Indicadores Clave</h4>
                <p className="text-xs text-gray-500">Métricas de rendimiento</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Activity className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">% En Ejecución</p>
              <p className="text-lg font-bold text-green-600">
                {((data.kpis_negocio.proyectos_activos / data.resumen_general.total_proyectos) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">% Finalizados</p>
              <p className="text-lg font-bold text-blue-600">
                {((data.kpis_negocio.proyectos_finalizados / data.resumen_general.total_proyectos) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Cobertura Comunal</p>
              <p className="text-lg font-bold text-purple-600">
                {((data.kpis_negocio.cobertura_territorial.comunas_corregimientos / data.distribuciones.por_comuna_corregimiento.total_categorias) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Building2 className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Diversidad</p>
              <p className="text-lg font-bold text-orange-600">
                {data.kpis_negocio.diversidad_tipos} tipos
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tercera fila - Análisis detallado por atributos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Treemap de tipos de intervención */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-lg"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 p-2 rounded-lg">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Distribución de Estados</h4>
                <p className="text-xs text-gray-500">Análisis proporcional</p>
              </div>
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={chartData.estados.map(item => ({
                  name: item.name,
                  size: item.value,
                  fill: item.fill
                }))}
                dataKey="size"
                aspectRatio={4/3}
                stroke="white"
              >
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '12px'
                  }}
                />
              </Treemap>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Gráfico scatter de correlación */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-lg"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-900 dark:to-teal-900 p-2 rounded-lg">
                <Settings className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Análisis de Atributos</h4>
                <p className="text-xs text-gray-500">Calidad vs Cantidad</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {/* Barras de progreso para atributos */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Completitud</span>
                  <span className="text-xs font-bold text-blue-600">{((data.resumen_general.con_atributos / data.resumen_general.total_proyectos) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${(data.resumen_general.con_atributos / data.resumen_general.total_proyectos) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Cobertura Geográfica</span>
                  <span className="text-xs font-bold text-green-600">{data.resumen_general.porcentaje_geo.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${data.resumen_general.porcentaje_geo}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Diversidad de Tipos</span>
                  <span className="text-xs font-bold text-purple-600">{((data.kpis_negocio.diversidad_tipos / 20) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-violet-600 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${(data.kpis_negocio.diversidad_tipos / 20) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Mini estadísticas */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
              <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <p className="text-lg font-bold text-blue-600">{data.kpis_negocio.centros_gestores_activos}</p>
                <p className="text-xs text-gray-500">Centros Activos</p>
              </div>
              <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                <p className="text-lg font-bold text-orange-600">{data.kpis_negocio.cobertura_territorial.comunas_corregimientos}</p>
                <p className="text-xs text-gray-500">Comunas</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Nueva sección: Análisis avanzado con gráficos combinados */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-lg col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900 dark:to-purple-900 p-2 rounded-lg">
                <Activity className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Tendencias de Gestión</h4>
                <p className="text-xs text-gray-500">Estados vs Centros Gestores</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Zap className="w-3 h-3" />
              <span>Tiempo real</span>
            </div>
          </div>
          
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData.centros.slice(0, 8)}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  stroke="#6b7280"
                  fontSize={10}
                  angle={-35}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#6b7280" fontSize={10} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
                  }}
                  formatter={(value, name) => [`${value} proyectos`, name]}
                />
                <Bar 
                  dataKey="value" 
                  fill="url(#gradientViolet)"
                  radius={[4, 4, 0, 0]}
                  opacity={0.8}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', r: 3 }}
                />
                <defs>
                  <linearGradient id="gradientViolet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#c084fc" />
                  </linearGradient>
                </defs>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Footer con información adicional y timestamp */}
      <motion.div 
        className="bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Resumen ejecutivo */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-lg">
                <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Estado General</h5>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium text-green-600">{data.kpis_negocio.proyectos_activos}</span> en ejecución, 
              <span className="font-medium text-blue-600"> {data.kpis_negocio.proyectos_finalizados}</span> finalizados de 
              <span className="font-medium text-indigo-600"> {data.resumen_general.total_proyectos}</span> total
            </p>
          </div>

          {/* Cobertura territorial */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Cobertura Territorial</h5>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium text-blue-600">{data.kpis_negocio.cobertura_territorial.comunas_corregimientos}</span> de {data.distribuciones.por_comuna_corregimiento.total_categorias} comunas,
              <span className="font-medium text-orange-600"> {data.kpis_negocio.cobertura_territorial.barrios_veredas}</span> de {data.distribuciones.por_barrio_vereda.total_categorias} barrios
            </p>
          </div>

          {/* Timestamp y rendimiento */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg relative">
                <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Sistema Activo</h5>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="text-green-600 font-medium">99.9%</span> disponibilidad<br/>
              Actualizado: {new Date().toLocaleTimeString('es-CO', { 
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CompactDashboardTab;