/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build-time flags. `ACCESS_GATE=off` produces the ungated submission build;
  // default (`on`) produces the gated private-demo build.
  env: {
    NEXT_PUBLIC_ACCESS_GATE: process.env.ACCESS_GATE ?? 'on',
    NEXT_PUBLIC_ACCESS_CODE: process.env.ACCESS_CODE ?? 'tomide',
  },
};

export default nextConfig;
