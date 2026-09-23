/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Tree-shake framer-motion so only the pieces we use ship to the client.
    optimizePackageImports: ["framer-motion"],
  },
};

export default nextConfig;
