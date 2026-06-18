import { NextResponse } from 'next/server';
import { clearSession } from '../../../lib/session';

export async function GET(request) {
  const { origin } = new URL(request.url);
  clearSession();
  return NextResponse.redirect(`${origin}/`);
}
