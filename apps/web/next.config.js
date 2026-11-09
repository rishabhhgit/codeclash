/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@codeclash/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/problems/:slug/question',
        destination: '/problems/:slug',
      },
      {
        source: '/leaderboard',
        destination: '/rankings',
      },
    ];
  },
};

module.exports = nextConfig;
