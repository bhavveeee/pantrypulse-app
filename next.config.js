/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  // Force Vercel to bundle the private HTML file with the API function that reads it.
  outputFileTracingIncludes: {
    "/api/app": ["./private/**"],
  },
};
