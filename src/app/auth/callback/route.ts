
import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const supabase = createClient();

  if (code) {
    // exchange the auth code for a session
    await supabase.auth.exchangeCodeForSession(code);
  }

  // URL to redirect to after sign in process completes
  // This will be handled by the middleware, which will check the role
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
}
