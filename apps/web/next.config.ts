import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["127.0.0.1", "localhost"],
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
