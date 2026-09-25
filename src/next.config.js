/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingIncludes: {
      "/api/app": ["./private/**"],
      "/api/igho": ["./private/igho/**"],
    },
  },
};
