'use client';

import { useEffect, useState } from 'react';

export default function LoginButton() {
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    const handler = (event) => {
      if (event.data === 'notion-auth-success') {
        window.location.reload();
      }
    };
    window.addEventListener('message', handler);

    const onFocus = () => {
      if (opened) window.location.reload();
    };
    window.addEventListener('focus', onFocus);

    return () => {
      window.removeEventListener('message', handler);
      window.removeEventListener('focus', onFocus);
    };
  }, [opened]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>

      href="/api/auth/login"
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => setOpened(true)}
      style={{ background: '#fff', border: '0.5px solid #FFB6C1', color: '#d4537e', borderRadius: 8, padding: '12px 24px', fontSize: 15, fontWeight: 500, textDecoration: 'none', cursor: 'pointer' }}
      >
      노션으로 로그인
    </a>
      {
    opened && (
      <button
        onClick={() => window.location.reload()}
        style={{ background: 'none', border: 'none', color: '#888', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
      >
        로그인 완료했어요 (새로고침)
      </button>
    )
  }
    </div >
  );
}