import type { NextConfig } from "next";

// GitHub Pages serves this repo under /bachlong-inventory-project/, so the
// static export needs that base path baked in only for that build.
const isGhPages = process.env.GITHUB_PAGES === "true";
const basePath = "/bachlong-inventory-project";

const nextConfig: NextConfig = {
  output: "export",
  ...(isGhPages ? { basePath, assetPrefix: basePath } : {}),
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ["*.space-z.ai", "preview-chat-*.space-z.ai"],
  // Serve assets reliably for cross-origin preview
  experimental: {
    // reduce memory pressure
    optimizePackageImports: ["lucide-react", "recharts", "framer-motion"],
  },
};

export default nextConfig;
