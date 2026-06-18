'use client';

import { useState } from 'react';

// 노션 앱에 임베드할 본인 전용 위젯 주소를 보여주고 복사 기능 제공
export default function WidgetUrlBox({ url }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  };

  return (
    <div style={{ background: '#fafafa', border: '0.5px solid #eee', borderRadius: 8, padding: '12px 16px', margin: '0 24px 16px', fontSize: 13 }}>
      <div style={{ color: '#888', marginBottom: 6 }}>
        📌 노션 앱에 임베드하려면 이 주소를 복사해 <code>/embed</code>로 넣으세요:
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          readOnly
          value={url}
          style={{ flex: 1, padding: '6px 10px', fontSize: 12, border: '0.5px solid #ddd', borderRadius: 6, color: '#555', background: '#fff' }}
          onFocus={(e) => e.target.select()}
        />
        <button
          onClick={copy}
          style={{ padding: '6px 14px', fontSize: 12, border: '0.5px solid #FFB6C1', borderRadius: 6, background: '#fff', color: '#d4537e', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          {copied ? '복사됨!' : '복사'}
        </button>
      </div>
    </div>
  );
}
