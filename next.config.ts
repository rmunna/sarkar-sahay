import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  compress: true,
  poweredByHeader: false,
  async redirects() {
    return [
      // NOTE: the apex→www host redirect that used to live here was removed
      // during the Cloudflare migration — on OpenNext the `has host` match is
      // too loose (it fired on www too) and `:path*` is not interpolated in an
      // absolute destination, which 308-looped every page to "/:path*".
      // Apex→www canonicalization is handled by per-page <link rel="canonical">
      // tags (all point to https://www.citizennest.com/...). For a hard
      // apex→www redirect, add a Cloudflare Redirect Rule at the edge instead.
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
      {
        source: "/guide/abha-health-id-create-online",
        destination: "/guide/abha-health-id",
        permanent: true,
      },
      {
        source: "/guide/digital-health-id-abha-create",
        destination: "/guide/abha-health-id",
        permanent: true,
      },
      {
        source: "/guide/digital-health-id-abha-uses",
        destination: "/guide/abha-health-id",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
