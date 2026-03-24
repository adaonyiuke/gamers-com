import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cf.geekdo-images.com",
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  // Suppresses source map upload logs during build
  silent: true,

  // Upload source maps for better stack traces
  org: "clubplay",
  project: "javascript-nextjs",

  // Only upload source maps in CI/production builds
  sourcemaps: {
    disable: process.env.NODE_ENV === "development",
  },
});
