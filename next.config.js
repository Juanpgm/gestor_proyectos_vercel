/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  poweredByHeader: false,
  generateEtags: false,
  trailingSlash: false,
};

module.exports = nextConfig;
