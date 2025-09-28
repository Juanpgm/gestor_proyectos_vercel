/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Desactivar ESLint durante el build
    ignoreDuringBuilds: true,
  },
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
  
  // Headers para optimización - DESHABILITADO
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
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
      // Mapeos para unidades de proyecto - eliminados (archivos no existen)
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
