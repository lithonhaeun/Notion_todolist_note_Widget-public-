import { headers } from 'next/headers';
import { getSession } from './lib/session';
import { getConnection } from './lib/supabase';
import Widget from './Widget';
import LoginButton from './LoginButton';
import WidgetUrlBox from './WidgetUrlBox';

export default async function Home() {
  const userId = getSession();

  // 로그인 안 한 경우: 노션 로그인 버튼
  if (!userId) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 500, margin: 0 }}>주간 투두 위젯</h1>
        <p style={{ fontSize: 15, color: '#888', margin: 0, textAlign: 'center' }}>
          노션 계정으로 로그인하면<br />본인 데이터베이스와 연동된 위젯을 사용할 수 있어요.
        </p>
        <LoginButton />
      </div>
    );
  }

  // 로그인 한 경우: 본인 위젯 주소 + 위젯
  const conn = await getConnection(userId);
  const host = headers().get('host');
  const proto = host && host.includes('localhost') ? 'http' : 'https';
  const widgetUrl = conn?.widgetToken ? `${proto}://${host}/w/${conn.widgetToken}` : null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 24px 0' }}>
        <a href="/api/auth/logout" style={{ fontSize: 12, color: '#aaa', textDecoration: 'none' }}>로그아웃</a>
      </div>
      {widgetUrl && <WidgetUrlBox url={widgetUrl} />}
      <Widget />
    </div>
  );
}
