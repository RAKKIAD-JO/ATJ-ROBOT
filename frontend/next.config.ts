import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://localhost:5000";
const IOT_SERVER_URL = process.env.IOT_INTERNAL_URL || "http://localhost:3000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`, 
      },
      {
        source: "/uploads/:path*",
        destination: `${BACKEND_URL}/uploads/:path*`,
      },
      {
        source: "/iot-api/:path*",
        destination: `${IOT_SERVER_URL}/:path*`,
      },
      {
        source: "/robot/:path*",
        destination: `${BACKEND_URL}/robot/:path*`,
      },
    ];
  },
};

export default nextConfig;