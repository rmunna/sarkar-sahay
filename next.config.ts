import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  compress: true,
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "citizennest.com" }],
        destination: "https://www.citizennest.com/:path*",
        permanent: true, // 308 redirect — tells Google www is canonical
      },
    ];
  },
};

export default nextConfig;
