import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The shared workspace package ships TypeScript source directly, so Next must
  // transpile it (Just-in-Time package pattern).
  transpilePackages: ["@liveleagues/core"],
};

export default nextConfig;
