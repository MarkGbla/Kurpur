/** @type {import('next').NextConfig} */
const nextConfig = {
  // Avoid webpack filesystem cache ENOENT / "doesn't lead to expected result" on Windows dev
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = { type: "memory" };
    }
    return config;
  },
};

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

module.exports = withPWA(nextConfig);
