import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow Ngrok
  allowedDevOrigins: ['unsarcastic-unpatriotically-myrna.ngrok-free.dev', '*.ngrok-free.dev', '*.ngrok.app', '*.ngrok.io'],

};

export default nextConfig;
