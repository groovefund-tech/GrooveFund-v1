// next.config.js
// Force rebuild - clear old cache

/** @type {import('next').NextConfig} */
const nextConfig = {
  api: {
    bodyParser: {
      sizeLimit: '100mb', // Increase to 100mb
    },
  },
  // ... rest of config
}

module.exports = nextConfig
module.exports = {
  // ... your existing config ...
  
  // Add this section for sitemap generation
  reactStrictMode: true,
  
  // Ensure all pages are static/prerendered
  eslint: {
    ignoreDuringBuilds: true,
  },
};
