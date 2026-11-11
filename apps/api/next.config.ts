import path from 'path';

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Standalone package — Vercel Root Directory = apps/api.
  // Prevent Next from picking the Expo package-lock two levels up.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
