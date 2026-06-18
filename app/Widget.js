'use client';

import { useState, useEffect, useCallback } from 'react';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

function getThisWeekStart() {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const d = new Date(today.setDate(diff));
  d.setHours(0, 0, 0, 0);
  return d;
}

function fmt(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function Widget() {
  const [tasks, setTasks] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [error, setError] = useState('');
  const [needDatabase, setNeedDatabase] = useState(false);
  const [databases, setDatabases] = useState([]);
  const [loading, setLoading] = useState(true);

  const getWeekStart = useCallback(() => {
    const d = getThisWeekStart();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const getDate = useCallback((i) => {
    const d = new Date(getWeekStart());
    d.setDate(d.getDate() + i);
    return d;
  }, [getWeekStart]);

  const api = async (body) => {
    const res = await fetch('/api/notion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      if (data.needDatabase) setNeedDatabase(true);
      throw new Error(data.error || '요청 실패');
    }
    return data;
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api({ action: 'list', weekStart: fmt(getWeekStart()) });
      setTasks(data.tasks);
      setError('');
      setNeedDatabase(false);
    } catch (e) {
      if (e.message.includes('데이터베이스')) {
        loadDatabases();
      } else {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  }, [getWeekStart]);

  const loadDatabases = async () => {
    try {
      const data = await api({ action: 'listDatabases' });
      setDatabases(data.databases);
      setNeedDatabase(true);
    } catch (e) {
      setError(e.message);
    }
  };

  const selectDatabase = async (databaseId) => {
    try {
      await api({ action: 'selectDatabase', databaseId });
      setNeedDatabase(false);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { load(); }, [load]);

  const add = async (date, title) => {
    if (!title.trim()) return;
    try { await api({ action: 'add', date, title }); load(); }
    catch (e) { setError(e.message); }
  };
  const toggle = async (id, done) => {
    try { await api({ action: 'toggle', id, done }); load(); }
    catch (e) { setError(e.message); }
  };
  const del = async (id) => {
    try { await api({ action: 'delete', id }); load(); }
    catch (e) { setError(e.message); }
  };

  // DB 선택 화면
  if (needDatabase) {
    return (
      <div style={{ padding: '2rem', maxWidth: 480, margin: '0 auto' }}>
        <h2 style={{ fontSize: 18, fontWeight: 500 }}>사용할 데이터베이스를 선택하세요</h2>
        <p style={{ fontSize: 13, color: '#888' }}>연결한 노션에서 투두로 쓸 데이터베이스를 골라주세요.</p>
        {databases.length === 0 && <p style={{ fontSize: 13, color: '#e24b4a' }}>연결된 데이터베이스가 없습니다. 노션 로그인 시 데이터베이스 접근을 허용했는지 확인하세요.</p>}
        {databases.map((db) => (
          <button key={db.id} onClick={() => selectDatabase(db.id)}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 14px', margin: '8px 0', border: '0.5px solid #ddd', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14 }}>
            {db.title}
          </button>
        ))}
      </div>
    );
  }

  const today = fmt(new Date());
  const start = getWeekStart();
  const end = getDate(6);
  const weekLabel = `${start.getMonth() + 1}월 ${start.getDate()}일 ~ ${end.getMonth() + 1}월 ${end.getDate()}일${weekOffset === 0 ? ' (이번 주)' : ''}`;

  const btnStyle = { background: '#fff', border: '0.5px solid #FFB6C1', color: '#FFB6C1', borderRadius: 6, width: 32, height: 32, fontSize: 16, cursor: 'pointer' };

  return (
    <div style={{ padding: '1.5rem' }}>
      {error && <div style={{ padding: 12, marginBottom: 16, background: '#ffebeb', color: '#e24b4a', borderRadius: 6, fontSize: 13 }}>{error}</div>}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
        <button style={btnStyle} onClick={() => setWeekOffset((w) => w - 1)}>‹</button>
        <span style={{ fontSize: 15, fontWeight: 500, color: '#555', minWidth: 200, textAlign: 'center' }}>{weekLabel}</span>
        <button style={btnStyle} onClick={() => setWeekOffset((w) => w + 1)}>›</button>
        <button style={{ background: '#fff', border: '0.5px solid #ddd', color: '#888', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }} onClick={() => setWeekOffset(0)}>오늘</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
        {[...Array(7)].map((_, i) => {
          const date = getDate(i);
          const dt = fmt(date);
          const isToday = dt === today;
          const dayTasks = tasks.filter((t) => t.date === dt);
          return (
            <DayColumn key={i} dayName={DAYS[i]} dateLabel={`${date.getMonth() + 1}/${date.getDate()}`}
              isToday={isToday} isLast={i === 6} tasks={dayTasks}
              onAdd={(title) => add(dt, title)} onToggle={toggle} onDelete={del} />
          );
        })}
      </div>
    </div>
  );
}

function DayColumn({ dayName, dateLabel, isToday, isLast, tasks, onAdd, onToggle, onDelete }) {
  const [input, setInput] = useState('');
  const submit = () => { if (input.trim()) { onAdd(input); setInput(''); } };

  return (
    <div style={{ borderRight: isLast ? 'none' : '1px solid #ddd', padding: 10, minHeight: 380, display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 12, color: isToday ? '#FFB6C1' : '#666', fontWeight: isToday ? 700 : 500, textTransform: 'uppercase', marginBottom: 14, textAlign: 'center', whiteSpace: 'nowrap' }}>
        {dayName} {dateLabel}
      </div>
      <div style={{ flex: 1 }}>
        {[...Array(8)].map((_, j) => {
          const task = tasks[j];
          return (
            <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, minHeight: 22 }}>
              <input type="checkbox" checked={task?.done || false} disabled={!task}
                onChange={() => task && onToggle(task.id, task.done)}
                style={{ width: 16, height: 16, accentColor: '#FFB6C1', flexShrink: 0 }} />
              <div style={{ flex: 1, borderBottom: '1px solid #ccc', minHeight: 18, display: 'flex', alignItems: 'center', minWidth: 0 }}>
                <span style={{ fontSize: 12, padding: '0 2px', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: task?.done ? '#999' : '#333', textDecoration: task?.done ? 'line-through' : 'none' }}>
                  {task?.title || ''}
                </span>
              </div>
              {task && <button onClick={() => onDelete(task.id)} style={{ background: 0, border: 0, color: '#ccc', cursor: 'pointer', fontSize: 13, width: 14, height: 14, flexShrink: 0 }}>✕</button>}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 'auto', paddingTop: 10, borderTop: '1px solid #ddd' }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="추가..."
          style={{ flex: 1, minWidth: 0, padding: 6, fontSize: 11, border: '0.5px solid #ddd', borderRadius: 5, outline: 'none' }} />
        <button onClick={submit} style={{ background: '#fff', color: '#FFB6C1', border: '0.5px solid #FFB6C1', borderRadius: 5, cursor: 'pointer', fontSize: 14, width: 28, height: 28, flexShrink: 0 }}>+</button>
      </div>
    </div>
  );
}
