import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// 사용자가 "노션으로 로그인"을 누르면 이 라우트로 들어옵니다.
// 노션 인증 페이지로 보내고, CSRF 방지용 state를 쿠키에 저장합니다.

export async function GET() {
  const clientId = process.env.NOTION_OAUTH_CLIENT_ID;
  const redirectUri = process.env.NOTION_REDIRECT_URI;

  // CSRF 방지: 랜덤 state 생성 후 쿠키에 저장, 콜백에서 대조
  const state = crypto.randomBytes(16).toString('hex');
  cookies().set('oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: 600, // 10분
  });

  const authUrl = new URL('https://api.notion.com/v1/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('owner', 'user');
  authUrl.searchParams.set('state', state);

  return NextResponse.redirect(authUrl.toString());
}
