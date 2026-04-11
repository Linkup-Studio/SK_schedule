import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/SK_schedule",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
