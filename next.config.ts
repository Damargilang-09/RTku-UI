import type { NextConfig } from "next";

const nextConfig: NextConfig = {
 async rewrites() {
  return [
    {
      source: "/RTku/api/:path*",
      destination: "https://kas-rt-api.vercel.app/RTku/api/:path*",
    },
  ];
}
};

export default nextConfig;


