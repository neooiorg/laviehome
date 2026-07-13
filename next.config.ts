import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.postimg.cc" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "images.unsplash.com" },
      // Medusa backend uploads (Dokploy deployment — sslip.io subdomains)
      { protocol: "http", hostname: "**.sslip.io" },
      { protocol: "https", hostname: "**.sslip.io" },
      // Local dev
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

export default nextConfig;
