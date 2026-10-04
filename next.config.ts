import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets the e2e server build next to a running dev server.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
};

export default nextConfig;
