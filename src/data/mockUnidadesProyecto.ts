/**
 * Datos mock para Unidades de Proyecto - DESCONECTADO DE API
 * Para desarrollo y edición sin dependencias externas
 */

export interface UnidadProyectoMock {
  id: string
  bpin: string
  upid: string
  nombre_up: string
  descripcion_intervencion?: string
  direccion?: string
  
  // Ubicación
  comuna_corregimiento: string
  barrio_vereda?: string
  coordinates?: {
    lat: number
    lng: number
  }
  
  // Información del proyecto
  tipo_intervencion: string
  clase_obra: string
  estado?: string
  avance_obra: number
  presupuesto_base: number
  
  // Fechas
  fecha_inicio?: string
  fecha_fin?: string
  ano: string
  
  // Responsables
  nombre_centro_gestor: string
  
  // Contratos y procesos
  referencia_contrato?: string
  referencia_proceso?: string
  url_proceso?: string
  
  // Fuente de financiación
  fuente_financiacion?: string
  
  // Metadatos
  plataforma?: string
  dataframe?: string
  updated_at: string
  has_geometry: boolean
  geometry_type: string
  
  // Para compatibilidad con mapa (estructura GeoJSON-like)
  properties?: {
    bpin: string
    nombre_up: string
    tipo_intervencion: string
    estado?: string
    comuna_corregimiento: string
    avance_obra: number
    presupuesto_base: number
  }
  
  geometry?: {
    type: 'Point'
    coordinates: [number, number] // [lng, lat]
  }
}

// Datos base mock
const mockUnidadesProyecto: UnidadProyectoMock[] = [
  {
    id: "1",
    bpin: "2023760010146",
    upid: "UNP-001",
    nombre_up: "Adecuación Institución Educativa La Libertad",
    descripcion_intervencion: "Adecuación de infraestructura educativa para mejorar condiciones de aprendizaje",
    direccion: "Carrera 45 # 67-89, Barrio La Libertad",
    comuna_corregimiento: "Comuna 1",
    barrio_vereda: "La Libertad",
    coordinates: {
      lat: 3.4516,
      lng: -76.5320
    },
    tipo_intervencion: "Adecuación",
    clase_obra: "Infraestructura Educativa",
    estado: "En ejecución",
    avance_obra: 0.65,
    presupuesto_base: 850000000,
    fecha_inicio: "2024-03-15",
    fecha_fin: "2024-12-20",
    ano: "2024",
    nombre_centro_gestor: "Secretaría de Educación",
    referencia_contrato: "CT-2024-001",
    referencia_proceso: "PR-2024-EDU-001",
    fuente_financiacion: "Recursos Propios",
    plataforma: "SECOP",
    dataframe: "educacion",
    updated_at: "2024-09-27T20:00:00Z",
    has_geometry: true,
    geometry_type: "Point",
    properties: {
      bpin: "2023760010146",
      nombre_up: "Adecuación Institución Educativa La Libertad",
      tipo_intervencion: "Adecuación",
      estado: "En ejecución",
      comuna_corregimiento: "Comuna 1",
      avance_obra: 0.65,
      presupuesto_base: 850000000
    },
    geometry: {
      type: 'Point',
      coordinates: [-76.5320, 3.4516]
    }
  },
  {
    id: "2",
    bpin: "2023760010147",
    upid: "UNP-002",
    nombre_up: "Construcción Puente Peatonal La Esperanza",
    descripcion_intervencion: "Construcción de puente peatonal para conectividad barrial",
    direccion: "Quebrada La Esperanza, Barrio Buenos Aires",
    comuna_corregimiento: "Comuna 2",
    barrio_vereda: "Buenos Aires",
    coordinates: {
      lat: 3.4616,
      lng: -76.5220
    },
    tipo_intervencion: "Construcción",
    clase_obra: "Infraestructura Vial",
    estado: "En alistamiento",
    avance_obra: 0.15,
    presupuesto_base: 420000000,
    fecha_inicio: "2024-01-10",
    fecha_fin: "2024-08-30",
    ano: "2024",
    nombre_centro_gestor: "Secretaría de Infraestructura",
    referencia_contrato: "CT-2024-002",
    referencia_proceso: "PR-2024-INF-002",
    fuente_financiacion: "SGR",
    plataforma: "SECOP",
    dataframe: "infraestructura",
    updated_at: "2024-09-27T20:00:00Z",
    has_geometry: true,
    geometry_type: "Point",
    properties: {
      bpin: "2023760010147",
      nombre_up: "Construcción Puente Peatonal La Esperanza",
      tipo_intervencion: "Construcción",
      estado: "En alistamiento",
      comuna_corregimiento: "Comuna 2",
      avance_obra: 0.15,
      presupuesto_base: 420000000
    },
    geometry: {
      type: 'Point',
      coordinates: [-76.5220, 3.4616]
    }
  }
]

const generateMoreMockData = (baseCount: number = 50): UnidadProyectoMock[] => {
  const moreData: UnidadProyectoMock[] = []
  
  const tipos = ["Adecuación", "Construcción", "Rehabilitación", "Mejoramiento", "Ampliación"]
  const clases = ["Infraestructura Educativa", "Infraestructura Vial", "Espacio Público", "Infraestructura de Salud", "Servicios Públicos"]
  const estados = ["En alistamiento", "En ejecución", "Completado", "Suspendido", "En evaluación"]
  const comunas = [
    "Comuna 1", "Comuna 2", "Comuna 3", "Comuna 4", "Comuna 5", "Comuna 6",
    "Comuna 7", "Comuna 8", "Comuna 9", "Comuna 10", "Comuna 11", "Comuna 12",
    "Comuna 13", "Comuna 14", "Comuna 15", "Comuna 16", "Comuna 17", "Comuna 18",
    "Comuna 19", "Comuna 20", "Comuna 21", "Comuna 22"
  ]
  const centros = [
    "Secretaría de Educación", "Secretaría de Infraestructura", "Secretaría de Medio Ambiente",
    "Secretaría de Salud", "Secretaría de Cultura", "Secretaría de Deportes"
  ]
  
  for (let i = 3; i <= baseCount; i++) {
    const tipoIndex = Math.floor(Math.random() * tipos.length)
    const claseIndex = Math.floor(Math.random() * clases.length)
    const estadoIndex = Math.floor(Math.random() * estados.length)
    const comunaIndex = Math.floor(Math.random() * comunas.length)
    const centroIndex = Math.floor(Math.random() * centros.length)
    
    const lat = 3.4516 + (Math.random() - 0.5) * 0.2
    const lng = -76.5320 + (Math.random() - 0.5) * 0.15
    const bpin = `202376001${String(i).padStart(4, '0')}`
    const nombreUp = `Proyecto ${tipos[tipoIndex]} ${i}`
    const presupuesto = Math.floor(Math.random() * 2000000000) + 100000000
    const avance = Math.random()
    
    moreData.push({
      id: i.toString(),
      bpin,
      upid: `UNP-${String(i).padStart(3, '0')}`,
      nombre_up: nombreUp,
      descripcion_intervencion: `${tipos[tipoIndex]} de infraestructura para beneficio de la comunidad`,
      direccion: `Dirección de ejemplo ${i}`,
      comuna_corregimiento: comunas[comunaIndex],
      barrio_vereda: `Barrio ${i}`,
      coordinates: { lat, lng },
      tipo_intervencion: tipos[tipoIndex],
      clase_obra: clases[claseIndex],
      estado: estados[estadoIndex],
      avance_obra: avance,
      presupuesto_base: presupuesto,
      fecha_inicio: "2024-01-01",
      fecha_fin: "2024-12-31",
      ano: "2024",
      nombre_centro_gestor: centros[centroIndex],
      referencia_contrato: `CT-2024-${String(i).padStart(3, '0')}`,
      referencia_proceso: `PR-2024-${String(i).padStart(3, '0')}`,
      fuente_financiacion: Math.random() > 0.5 ? "Recursos Propios" : "SGR",
      plataforma: "SECOP",
      dataframe: "general",
      updated_at: "2024-09-27T20:00:00Z",
      has_geometry: Math.random() > 0.2,
      geometry_type: "Point",
      
      // Para compatibilidad con mapa
      properties: {
        bpin,
        nombre_up: nombreUp,
        tipo_intervencion: tipos[tipoIndex],
        estado: estados[estadoIndex],
        comuna_corregimiento: comunas[comunaIndex],
        avance_obra: avance,
        presupuesto_base: presupuesto
      },
      
      geometry: {
        type: 'Point',
        coordinates: [lng, lat] // [lng, lat] para GeoJSON
      }
    })
  }
  
  return moreData
}

// Combinar datos base con datos generados
export const allMockUnidadesProyecto = [
  ...mockUnidadesProyecto,
  ...generateMoreMockData(100)
]

// Interfaz para métricas (compatibilidad con componentes)
export interface UnidadesProyectoMetrics {
  totalUnidades: number
  bpinsUnicos: number
  valorTotalProyectos: number
  valorPromedioPorProyecto: number
  avancePromedioObra: number
  distribuciones: {
    porEstado: Record<string, number>
    porTipoIntervencion: Record<string, number>
    porComuna: Record<string, number>
    porComunaCorregimiento: Record<string, number>
    porAno: Record<string, number>
    porCentroGestor: Record<string, number>
  }
  rangosPresupuesto: {
    bajo: number
    medio: number
    alto: number
  }
  rangosAvance: {
    sinIniciar: number
    enProceso: number
    completado: number
  }
}

// Métricas calculadas de los datos mock
export const mockMetrics: UnidadesProyectoMetrics = {
  totalUnidades: allMockUnidadesProyecto.length,
  bpinsUnicos: new Set(allMockUnidadesProyecto.map(u => u.bpin)).size,
  valorTotalProyectos: allMockUnidadesProyecto.reduce((sum, u) => sum + u.presupuesto_base, 0),
  valorPromedioPorProyecto: allMockUnidadesProyecto.reduce((sum, u) => sum + u.presupuesto_base, 0) / allMockUnidadesProyecto.length,
  avancePromedioObra: allMockUnidadesProyecto.reduce((sum, u) => sum + u.avance_obra, 0) / allMockUnidadesProyecto.length,
  distribuciones: {
    porEstado: allMockUnidadesProyecto.reduce((acc, u) => {
      acc[u.estado || 'Sin estado'] = (acc[u.estado || 'Sin estado'] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    porTipoIntervencion: allMockUnidadesProyecto.reduce((acc, u) => {
      acc[u.tipo_intervencion] = (acc[u.tipo_intervencion] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    porComuna: allMockUnidadesProyecto.reduce((acc, u) => {
      acc[u.comuna_corregimiento] = (acc[u.comuna_corregimiento] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    porComunaCorregimiento: allMockUnidadesProyecto.reduce((acc, u) => {
      acc[u.comuna_corregimiento] = (acc[u.comuna_corregimiento] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    porAno: allMockUnidadesProyecto.reduce((acc, u) => {
      acc[u.ano] = (acc[u.ano] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    porCentroGestor: allMockUnidadesProyecto.reduce((acc, u) => {
      acc[u.nombre_centro_gestor] = (acc[u.nombre_centro_gestor] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  },
  rangosPresupuesto: {
    bajo: allMockUnidadesProyecto.filter(u => u.presupuesto_base < 100000000).length,
    medio: allMockUnidadesProyecto.filter(u => u.presupuesto_base >= 100000000 && u.presupuesto_base < 1000000000).length,
    alto: allMockUnidadesProyecto.filter(u => u.presupuesto_base >= 1000000000).length
  },
  rangosAvance: {
    sinIniciar: allMockUnidadesProyecto.filter(u => u.avance_obra < 0.1).length,
    enProceso: allMockUnidadesProyecto.filter(u => u.avance_obra >= 0.1 && u.avance_obra < 0.9).length,
    completado: allMockUnidadesProyecto.filter(u => u.avance_obra >= 0.9).length
  }
}