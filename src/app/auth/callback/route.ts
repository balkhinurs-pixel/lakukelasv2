
import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (session?.user) {
      // After getting the session, check the user's role from the profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      if (profile && profile.role === 'admin') {
        // If user is an admin, redirect to the admin dashboard
        return NextResponse.redirect(new URL('/admin', request.url).origin + '/admin');
      }
    }
  }

  // For all other users or if there's an error, redirect to the default teacher dashboard
  return NextResponse.redirect(new URL('/dashboard', request.url).origin + '/dashboard');
}
