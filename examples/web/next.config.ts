import type { NextConfig } from "next";
import TailwindExtractorWebpackPlugin from "./tailwind-extractor-webpack-plugin";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = { ...config.optimization, minimize: false };
      config.plugins.push(
        new TailwindExtractorWebpackPlugin({
          output: "extracted-tailwind.css",
        })
      );
    }
    return config;
  },
};
export default nextConfig;
