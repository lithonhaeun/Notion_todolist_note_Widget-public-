import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { encrypt, decrypt } from './crypto';

// 서버 전용 Supabase 클라이언트 (service_role 키 사용 - 절대 클라이언트에 노출 금지)
function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

// OAuth 콜백에서 받은 사용자 연결 정보를 저장 (토큰은 암호화)
// 반환: 이 사용자의 widget_token (노션 앱 임베드용 URL에 사용)
export async function saveConnection({
  notionUserId,
  accessToken,
  workspaceId,
  workspaceName,
  databaseId = null,
}) {
  const supabase = getSupabase();

  // 기존 사용자면 기존 widget_token 유지, 신규면 새로 생성
  const existing = await getConnection(notionUserId);
  const widgetToken = existing?.widgetToken || crypto.randomBytes(24).toString('hex');

  const { error } = await supabase
    .from('user_connections')
    .upsert(
      {
        notion_user_id: notionUserId,
        access_token: encrypt(accessToken),
        workspace_id: workspaceId,
        workspace_name: workspaceName,
        database_id: existing?.databaseId || databaseId,
        widget_token: widgetToken,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'notion_user_id' }
    );
  if (error) throw new Error('연결 저장 실패: ' + error.message);
  return widgetToken;
}

// 사용자 ID로 연결 정보 조회 (토큰은 복호화해서 반환)
export async function getConnection(notionUserId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('user_connections')
    .select('*')
    .eq('notion_user_id', notionUserId)
    .single();

  if (error || !data) return null;

  return {
    notionUserId: data.notion_user_id,
    accessToken: decrypt(data.access_token),
    workspaceId: data.workspace_id,
    workspaceName: data.workspace_name,
    databaseId: data.database_id,
    widgetToken: data.widget_token,
  };
}

// widget_token으로 연결 정보 조회 (노션 앱 임베드 시 쿠키 없이 인증)
export async function getConnectionByToken(widgetToken) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('user_connections')
    .select('*')
    .eq('widget_token', widgetToken)
    .single();

  if (error || !data) return null;

  return {
    notionUserId: data.notion_user_id,
    accessToken: decrypt(data.access_token),
    workspaceId: data.workspace_id,
    workspaceName: data.workspace_name,
    databaseId: data.database_id,
    widgetToken: data.widget_token,
  };
}

// 사용자가 연결한 데이터베이스 ID 업데이트
export async function updateDatabaseId(notionUserId, databaseId) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('user_connections')
    .update({ database_id: databaseId, updated_at: new Date().toISOString() })
    .eq('notion_user_id', notionUserId);
  if (error) throw new Error('DB ID 업데이트 실패: ' + error.message);
}
