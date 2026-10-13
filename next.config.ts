import type { NextConfig } from "next";

// GitHub Pages is the only deploy target now: it serves this repo under
// /bachlong-inventory-project/ and can only serve static files, so the build
// is always a static export. basePath/assetPrefix only apply to the CI build
// (GITHUB_PAGES=true, set in .github/workflows/deploy-pages.yml) so `next dev`
// and a plain local `next build` keep running at the site root.
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
