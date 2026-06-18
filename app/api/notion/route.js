import { NextResponse } from 'next/server';
import { getSession } from '../../lib/session';
import { getConnection, updateDatabaseId } from '../../lib/supabase';

const NOTION_VERSION = '2022-06-28';

function getWeekStart(base) {
  const today = base ? new Date(base + 'T00:00:00') : new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(today.setDate(diff));
}

function fmt(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function POST(request) {
  // 1) 세션에서 사용자 확인
  const userId = getSession();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다', needLogin: true }, { status: 401 });
  }

  // 2) 사용자 연결 정보 (복호화된 토큰 포함)
  const conn = await getConnection(userId);
  if (!conn) {
    return NextResponse.json({ error: '연결 정보가 없습니다', needLogin: true }, { status: 401 });
  }

  const headers = {
    'Authorization': `Bearer ${conn.accessToken}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  };

  const body = await request.json();
  const { action } = body;

  try {
    // 사용자가 접근 가능한 데이터베이스 목록 검색 (DB 선택용)
    if (action === 'listDatabases') {
      const res = await fetch('https://api.notion.com/v1/search', {
        method: 'POST',
        headers,
        body: JSON.stringify({ filter: { property: 'object', value: 'database' } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '검색 실패');
      const databases = data.results.map((db) => ({
        id: db.id,
        title: db.title?.[0]?.plain_text || '제목 없음',
      }));
      return NextResponse.json({ databases, currentDatabaseId: conn.databaseId });
    }

    // 사용할 데이터베이스 선택/저장
    if (action === 'selectDatabase') {
      await updateDatabaseId(userId, body.databaseId);
      return NextResponse.json({ success: true });
    }

    // 이하 작업은 데이터베이스가 선택돼 있어야 함
    const DB = conn.databaseId;
    if (!DB) {
      return NextResponse.json({ error: '데이터베이스를 먼저 선택하세요', needDatabase: true }, { status: 400 });
    }

    if (action === 'list') {
      const weekStart = getWeekStart(body.weekStart);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const res = await fetch(`https://api.notion.com/v1/databases/${DB}/query`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          filter: {
            property: '날짜',
            date: { on_or_after: fmt(weekStart), on_or_before: fmt(weekEnd) },
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '조회 실패');
      const tasks = data.results.map((p) => ({
        id: p.id,
        title: p.properties['이름']?.title?.[0]?.plain_text || '',
        date: p.properties['날짜']?.date?.start || '',
        done: p.properties['완료']?.checkbox || false,
      }));
      return NextResponse.json({ tasks });
    }

    if (action === 'add') {
      const { date, title } = body;
      const properties = {
        '이름': { title: [{ text: { content: title } }] },
        '완료': { checkbox: false },
      };
      if (date) properties['날짜'] = { date: { start: date } };

      const res = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers,
        body: JSON.stringify({ parent: { database_id: DB }, properties }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '추가 실패');
      return NextResponse.json({ success: true });
    }

    if (action === 'toggle') {
      const { id, done } = body;
      const res = await fetch(`https://api.notion.com/v1/pages/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ properties: { '완료': { checkbox: !done } } }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || '업데이트 실패');
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      const { id } = body;
      const res = await fetch(`https://api.notion.com/v1/blocks/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || '삭제 실패');
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: '알 수 없는 action' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
