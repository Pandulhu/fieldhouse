/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@fieldhouse/types", "@fieldhouse/validators", "@fieldhouse/stats-engine"],
  images: {
    domains: ["your-project.supabase.co"],
  },
}

module.exports = nextConfig
