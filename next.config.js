/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep this as a dynamic Next.js app, not a static export.
  // The app uses server routes for AI feedback and speech transcription.
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    typedRoutes: false,
  },
};

module.exports = nextConfig;
