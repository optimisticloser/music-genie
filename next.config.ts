import type { NextConfig } from "next";
import { siteConfig } from "./src/lib/config";

const professionalAreaUrl =
  siteConfig.links?.professionalArea?.href ?? "https://doctor.egidesaude.com.br";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/area-do-profissional',
        destination: professionalAreaUrl,
        permanent: false,
      },
      {
        source: '/area-do-profissional/:path*',
        destination: professionalAreaUrl,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
