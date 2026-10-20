import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  outputFileTracingRoot: process.cwd(),
  async rewrites() {
    return [
      { source: "/build", destination: "/build.html" },
      { source: "/capital", destination: "/capital.html" },
      { source: "/growth", destination: "/growth.html" },
      { source: "/learn", destination: "/learn.html" },
      { source: "/earn", destination: "/earn.html" },
      { source: "/team", destination: "/team.html" },
      { source: "/account", destination: "/account.html" }
    ];
  }
};

export default nextConfig;
