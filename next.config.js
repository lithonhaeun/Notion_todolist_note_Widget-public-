/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // 노션 안에서 iframe 임베드를 허용하기 위한 헤더
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: 'frame-ancestors https://*.notion.so https://*.notion.site',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
