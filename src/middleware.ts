
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl

  console.log(`[Middleware] Path: ${pathname} | User ID: ${user?.id || 'Not Logged In'}`);

  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
      console.log(`[Middleware] Unauthorized access to ${pathname}, redirecting to /`);
      return NextResponse.redirect(new URL('/', request.url));
  }
  
  if (user) {
    // Ambil profile dengan error handling yang jelas
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    
    if (profileError) {
        console.error(`[Middleware] Error fetching profile:`, profileError.message);
    }

    const role = profile?.role || 'teacher';
    console.log(`[Middleware] Role Detected: ${role}`);

    const isAdmin = role === 'admin';
    const isHeadmaster = role === 'headmaster';

    // Rute akar: Redirect berdasarkan role
    if (pathname === '/') {
        const dest = isAdmin ? '/admin' : '/dashboard';
        console.log(`[Middleware] Redirecting from / to ${dest}`);
        return NextResponse.redirect(new URL(dest, request.url));
    }

    // Proteksi rute Admin
    if (pathname.startsWith('/admin')) {
      if (isAdmin) {
          console.log(`[Middleware] Admin access granted to ${pathname}`);
          return response;
      }

      const isAllowedMonitoring = pathname.startsWith('/admin/teacher-attendance') || pathname.startsWith('/admin/teacher-activity');
      if (isHeadmaster && isAllowedMonitoring) {
          console.log(`[Middleware] Headmaster monitoring access granted to ${pathname}`);
          return response;
      }

      console.log(`[Middleware] Access DENIED to ${pathname} for role ${role}. Redirecting to /dashboard`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    if (pathname === '/dashboard' && isAdmin) {
        console.log(`[Middleware] Admin trying to access /dashboard, redirecting to /admin`);
        return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
