import path from 'path';

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Standalone package — Vercel Root Directory = apps/api.
  // Prevent Next from picking the Expo package-lock two levels up.
  outputFileTracingRoot: path.join(__dirname),
  // Keep Neon driver on native Node require — bundling it can break HTTP fetch
  // to api.<region>.aws.neon.tech and surface as silent upsert failures.
  serverExternalPackages: ['@neondatabase/serverless'],
};

export default nextConfig;
