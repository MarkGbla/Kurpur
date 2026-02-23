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

module.exports = nextConfig;
