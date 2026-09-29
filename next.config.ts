import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js blocks cross-origin requests to the dev server by default —
  // needed so the app actually hydrates (and buttons work) when opened from
  // a phone over the LAN using this machine's local IP instead of localhost.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.16.*.*"],
};

export default nextConfig;
