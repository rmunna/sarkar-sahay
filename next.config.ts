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
      {
        source: "/guide/pm-surya-ghar-muft-bijli-yojana-solar",
        destination: "/guide/pm-surya-ghar-muft-bijli",
        permanent: true,
      },
      {
        source: "/guide/pm-surya-ghar-solar-apply",
        destination: "/guide/pm-surya-ghar-muft-bijli",
        permanent: true,
      },
      {
        source: "/guide/pm-surya-ghar-solar-rooftop",
        destination: "/guide/pm-surya-ghar-muft-bijli",
        permanent: true,
      },
      {
        source: "/guide/solar-rooftop-subsidy-apply",
        destination: "/guide/pm-surya-ghar-muft-bijli",
        permanent: true,
      },
      {
        source: "/guide/electricity-solar-rooftop-subsidy",
        destination: "/guide/pm-surya-ghar-muft-bijli",
        permanent: true,
      },
      {
        source: "/guide/national-solar-rooftop-subsidy-residential",
        destination: "/guide/pm-surya-ghar-muft-bijli",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
