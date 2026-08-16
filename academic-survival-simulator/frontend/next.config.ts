import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Security: don't advertise the framework via X-Powered-By header
  poweredByHeader: false,
  images: {
    // Restrict next/image to the project's own Supabase bucket
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
};

export default nextConfig;
