export const metadata = {
  title: '주간 투두 위젯',
  description: '노션과 연동되는 주간 투두리스트',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", sans-serif', background: '#fff', color: '#333' }}>
        {children}
      </body>
    </html>
  );
}
