/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@fieldhouse/types", "@fieldhouse/validators", "@fieldhouse/stats-engine"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
}

module.exports = nextConfig
