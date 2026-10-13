import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [{ source: "/simulate", destination: "/evaluate", permanent: true }];
  },
};

export default nextConfig;
