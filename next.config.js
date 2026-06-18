/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // 노션(웹/데스크톱 앱)에서 iframe 임베드를 허용
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
