'use client';

import { useEffect } from 'react';

export default function AuthComplete() {
  useEffect(() => {
    // 부모창(노션 iframe)에 로그인 성공 신호 전송 시도
    try {
      if (window.opener) {
        window.opener.postMessage('notion-auth-success', '*');
      }
    } catch (e) {}
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 40 }}>✅</div>
      <p style={{ fontSize: 18, color: '#333', margin: 0, fontWeight: 500 }}>로그인 완료!</p>
      <p style={{ fontSize: 14, color: '#888', margin: 0, lineHeight: 1.6 }}>
        이 탭을 닫고 노션으로 돌아가세요.<br />
        위젯이 자동으로 로그인된 상태로 바뀝니다.
      </p>
    </div>
  );
}
