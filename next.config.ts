import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_CMS_API_URL: process.env.NEXT_PUBLIC_CMS_API_URL ?? 'https://infostorage-cms.patrickoliverdeguzman.workers.dev',
  },
};

export default nextConfig;
