import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The shared workspace package ships TypeScript source directly, so Next must
  // transpile it (Just-in-Time package pattern).
  transpilePackages: ["@liveleague/core"],
};

export default nextConfig;
