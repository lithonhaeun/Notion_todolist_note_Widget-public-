/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: 'frame-ancestors https://*.notion.so https://*.notion.site https://*.notion.com https://www.notion.so;',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
