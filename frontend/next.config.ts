import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://backend:5000/api/:path*", 
      },
      {
        source: "/uploads/:path*",
        destination: "http://backend:5000/uploads/:path*",
      },
      {
        source: "/iot-api/:path*",
        destination: "http://iot-server:3000/:path*",
      },
      {
        source: "/robot/:path*",
        destination: "http://backend:5000/robot/:path*",
      },
    ];
  },
};

export default nextConfig;