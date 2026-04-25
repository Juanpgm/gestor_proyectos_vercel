/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  poweredByHeader: false,
  trailingSlash: false,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // exceljs relies on Node.js built-ins (stream, fs, etc.).
      // Provide browser-compatible fallbacks so the client bundle resolves.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        stream: require.resolve("stream-browserify"),
        buffer: require.resolve("buffer/"),
        crypto: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
