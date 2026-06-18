import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { saveConnection } from '../../../lib/supabase';
import { setSession } from '../../../lib/session';

// 노션이 인증 후 ?code=...&state=... 를 들고 이 라우트로 사용자를 돌려보냅니다.
// 1) state 검증 (CSRF) → 2) code를 access_token으로 교환 → 3) 암호화 저장 → 4) 세션 설정

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error)}`);
  }
  if (!code) {
    return NextResponse.redirect(`${origin}/?error=no_code`);
  }

  // CSRF 방지: 쿠키의 state와 대조
  const savedState = cookies().get('oauth_state')?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${origin}/?error=state_mismatch`);
  }
  cookies().delete('oauth_state');

  try {
    // code → access_token 교환 (client_id:client_secret을 Basic 인증으로)
    const clientId = process.env.NOTION_OAUTH_CLIENT_ID;
    const clientSecret = process.env.NOTION_OAUTH_CLIENT_SECRET;
    const redirectUri = process.env.NOTION_REDIRECT_URI;
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenRes = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      throw new Error(tokenData.error || '토큰 교환 실패');
    }

    // 토큰과 사용자 정보 추출
    const accessToken = tokenData.access_token;
    const workspaceId = tokenData.workspace_id;
    const workspaceName = tokenData.workspace_name;
    const notionUserId = tokenData.owner?.user?.id || tokenData.bot_id;

    // 암호화해서 DB에 저장
    await saveConnection({
      notionUserId,
      accessToken,
      workspaceId,
      workspaceName,
    });

    // 세션 쿠키 설정 후 메인으로
    setSession(notionUserId);
    return NextResponse.redirect(`${origin}/`);
  } catch (e) {
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(e.message)}`);
  }
}
