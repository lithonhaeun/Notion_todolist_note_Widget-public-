'use client';

import { useEffect } from 'react';

export default function AuthComplete() {
  useEffect(() => {
    if (window.opener) {
      try {
        window.opener.postMessage('notion-auth-success', '*');
      } catch (e) { }
      window.close();
    } else {
      window.location.href = '/';
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 16, color: '#555' }}>로그인 완료! 이 창은 자동으로 닫힙니다.</p>
      <p style={{ fontSize: 13, color: '#aaa' }}>닫히지 않으면 이 창을 닫고 노션으로 돌아가세요.</p>
    </div>
  );
}