import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/dashboard.html",
        destination: "/dashboard",
        permanent: true,
      },
      {
        source: "/legacy-dashboard",
        destination: "/legacy-dashboard.html",
        permanent: false,
      },
      {
        source: "/agents",
        destination: "/agents.html",
        permanent: false,
      },
      {
        source: "/field-manual",
        destination: "/trevor-field-manual.html",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
