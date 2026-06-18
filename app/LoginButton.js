'use client';

import { useEffect } from 'react';

export default function LoginButton() {
  useEffect(() => {
    const handler = (event) => {
      if (event.data === 'notion-auth-success') {
        window.location.reload();
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const openLogin = () => {
    const w = 500;
    const h = 700;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    const popup = window.open(
      '/api/auth/login',
      'notion-login',
      `width=${w},height=${h},left=${left},top=${top}`
    );
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      window.open('/api/auth/login', '_blank');
    }
  };

  return (