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

  // Rewrite para redirigir /geodata/ a /data/geodata/
  async rewrites() {
    return [
      {
        source: '/geodata/:path*',
        destination: '/data/geodata/:path*'
      }
    ];
  },
}

module.exports = nextConfig
