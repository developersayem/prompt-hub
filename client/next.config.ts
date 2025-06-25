// client/next.config.ts
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname), // If you're NOT using src folder
    };
    return config;
  },
};

export default nextConfig;
