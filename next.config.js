/** @type {import('next').NextConfig} */

// Función para detectar el entorno
const getEnvironment = () => {
  return process.env.NODE_ENV || 'development';
};

// Función para configurar optimizaciones según el entorno
const getOptimizations = (env) => {
  const isProduction = env === 'production';
  
  return {
    compress: isProduction,
    poweredByHeader: false,
    generateEtags: false, // Disable ETags
    trailingSlash: false,
    swcMinify: true, // Always enable SWC Minifier
  };
};

// Función para configurar headers según el entorno
const getHeaders = (env) => {
  const isProduction = env === 'production';
  
  return isProduction ? [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
      ],
    },
  ] : [
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
};

const environment = getEnvironment();
const optimizations = getOptimizations(environment);

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
  
  // Aplicar optimizaciones según el entorno
  ...optimizations,
  
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

    // Optimización de chunks para librerías grandes como Plotly
    config.optimization = config.optimization || {};
    config.optimization.splitChunks = {
      ...config.optimization.splitChunks,
      cacheGroups: {
        ...config.optimization.splitChunks?.cacheGroups,
        plotly: {
          test: /[\\/]node_modules[\\/](plotly\.js|react-plotly\.js)[\\/]/,
          name: 'plotly',
          chunks: 'async',
          priority: 30,
          enforce: true,
        },
      },
    };

    // Removed Babel loader to use SWC default transformation

    return config;
  },
  
  // Headers configurados según el entorno
  async headers() {
    return getHeaders(environment);
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
