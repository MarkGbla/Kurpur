const path = require("path");

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {
      config: path.join(__dirname, "tailwind.config.js"),
    },
  },
};

module.exports = config;
