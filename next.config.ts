import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Security: Disable x-powered-by header
  poweredByHeader: false,
  // Security: Compress responses
  compress: true,
  // Production optimizations
  reactStrictMode: true,
  // Security: SWC minification
  swcMinify: true,
};

export default nextConfig;
