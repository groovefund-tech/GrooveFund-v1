// next.config.js
// Force rebuild - clear old cache

// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
