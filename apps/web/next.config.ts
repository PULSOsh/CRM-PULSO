import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: [
    "@pulso/database",
    "@pulso/documents",
    "@pulso/email",
    "@pulso/integrations",
    "@pulso/storage",
    "@pulso/ui"
  ]
};

export default nextConfig;
