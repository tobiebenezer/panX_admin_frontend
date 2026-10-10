/** @type {import('next').NextConfig} */

// Dev-only proxy so `PAE_DEV_PROXY=1 npm run dev` can reach the Go API on
// :8080. Rewrites are ignored while `output: 'export'` is set, so proxy mode
// also drops static export (dev server never exports). `next build` runs
// without this env var and emits the plain static-export config.
const useProxy = process.env.PAE_DEV_PROXY === '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(useProxy ? {} : { output: 'export' }),
  trailingSlash: true,
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  ...(useProxy
    ? {
        // Without this, trailingSlash:true 308s every /v1 call to "/v1/x/"
        // BEFORE rewrites run, forwarding the slash to chi which 404s.
        skipTrailingSlashRedirect: true,
        async rewrites() {
          return [
            { source: '/v1/:path*', destination: 'http://localhost:8080/v1/:path*' },
          ];
        },
      }
    : {}),
};

export default nextConfig;
