import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Uploaded documents are read through our storage abstraction (lib/storage),
  // never served directly from the filesystem, so no image/static remote config
  // is needed for the MVP.
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
