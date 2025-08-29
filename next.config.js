/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    unoptimized: true, // Para Vercel static export si es necesario
  },
  compiler: { 
    styledComponents: true 
  },
  experimental: {
    esmExternals: 'loose',
  },
  // Optimización para producción
  compress: true,
  poweredByHeader: false,
  
  webpack: (config, { isServer }) => {
    // Handle kepler.gl and related dependencies
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        assert: false,
        http: false,
        https: false,
        url: false,
        zlib: false,
        util: false,
        buffer: false,
      };
    }

    // Optimización para archivos JSON grandes
    config.module.rules.push({
      test: /\.json$/,
      type: 'asset/resource',
    });

    return config;
  },
  
  // Headers para optimización
  async headers() {
    return [
      {
        source: '/data/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/geodata/:path*', 
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ];
  },

  // Rewrite para redirigir /geodata/ a /data/geodata/ con mapeo específico
  async rewrites() {
    return [
      // Mapeos específicos para archivos de cartografía base
      {
        source: '/geodata/barrios.geojson',
        destination: '/data/geodata/cartografia_base/barrios.geojson'
      },
      {
        source: '/geodata/comunas.geojson',
        destination: '/data/geodata/cartografia_base/comunas.geojson'
      },
      {
        source: '/geodata/corregimientos.geojson',
        destination: '/data/geodata/cartografia_base/corregimientos.geojson'
      },
      {
        source: '/geodata/veredas.geojson',
        destination: '/data/geodata/cartografia_base/veredas.geojson'
      },
      // Mapeos para unidades de proyecto
      {
        source: '/geodata/equipamientos.geojson',
        destination: '/data/geodata/unidades_proyecto/equipamientos.geojson'
      },
      {
        source: '/geodata/infraestructura_vial.geojson',
        destination: '/data/geodata/unidades_proyecto/infraestructura_vial.geojson'
      },
      // Mapeo para centros de gravedad
      {
        source: '/geodata/centros_gravedad_unificado.geojson',
        destination: '/data/geodata/centros_gravedad/centros_gravedad_unificado.geojson'
      },
      // Fallback general
      {
        source: '/geodata/:path*',
        destination: '/data/geodata/:path*'
      }
    ];
  },
}

module.exports = nextConfig
