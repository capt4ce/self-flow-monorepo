import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Enable static export for Cloudflare Pages
  images: {
    unoptimized: true, // Required for static export
  },
  transpilePackages: ['@self-flow/common'],
};

export default nextConfig;
