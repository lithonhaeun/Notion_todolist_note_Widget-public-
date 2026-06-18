import crypto from 'crypto';
import { cookies } from 'next/headers';

// 사용자 ID를 서명된 쿠키에 담아 세션을 유지합니다.
// 쿠키 값은 "userId.signature" 형태로, 서명으로 위변조를 막습니다.

const COOKIE_NAME = 'notion_session';

function sign(value) {
  return crypto
    .createHmac('sha256', process.env.SESSION_SECRET)
    .update(value)
    .digest('hex');
}

// 로그인 성공 시 호출: 사용자 ID를 쿠키에 저장
export function setSession(notionUserId) {
  const signature = sign(notionUserId);
  cookies().set(COOKIE_NAME, `${notionUserId}.${signature}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30일
  });
}

// 현재 로그인한 사용자 ID를 반환 (없거나 위조되면 null)
export function getSession() {
  const cookie = cookies().get(COOKIE_NAME);
  if (!cookie) return null;

  const [userId, signature] = cookie.value.split('.');
  if (!userId || !signature) return null;

  // 서명 검증 (타이밍 공격 방지를 위해 timingSafeEqual 사용)
  const expected = sign(userId);
  const valid =
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

  return valid ? userId : null;
}

// 로그아웃
export function clearSession() {
  cookies().delete(COOKIE_NAME);
}
