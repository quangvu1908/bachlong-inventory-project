import type { NextConfig } from "next";

// GitHub Pages serves this repo under /bachlong-inventory-project/ and can only
// serve static files, so that build (GITHUB_PAGES=true) stays a static export.
// Vercel runs the normal Next.js server, which the upcoming NextAuth work needs.
const isGhPages = process.env.GITHUB_PAGES === "true";
const basePath = "/bachlong-inventory-project";

const nextConfig: NextConfig = {
  ...(isGhPages
    ? { output: "export" as const, basePath, assetPrefix: basePath }
    // "standalone" is what the repo's `npm run build` script expects (it copies
    // into .next/standalone for self-hosting); Vercel also builds fine from it.
    : { output: "standalone" as const }),
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
