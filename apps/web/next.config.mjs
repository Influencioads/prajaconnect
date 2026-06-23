import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const apiProxyTarget = process.env.API_PROXY_TARGET || 'http://localhost:4000';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@praja/ui', '@praja/types'],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  // Tree-shake large barrel imports so dev compiles and bundles only what's used.
  experimental: { optimizePackageImports: ['recharts', 'lucide-react'] },
  // Pin the monorepo root so Next.js doesn't warn about inferred workspace root.
  outputFileTracingRoot: path.join(__dirname, '../../'),
  // Same-origin /api/* avoids cross-origin login failures while the stack starts up.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
