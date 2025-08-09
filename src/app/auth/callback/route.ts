
import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const supabase = createClient();

  if (code) {
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (session?.user) {
      // After getting the session, check the user's role from the profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      if (profile?.role === 'admin') {
        // If user is an admin, redirect to the admin dashboard
        return NextResponse.redirect(`${requestUrl.origin}/admin`);
      }
    }
  }

  // For all other users or if there's an error, redirect to the default teacher dashboard
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
}

    