
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

  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
      return NextResponse.redirect(new URL('/', request.url));
  }
  
  if (user) {
    // DIAGNOSTIC LOGGING: Cek data mentah dari database
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', user.id)
        .single();
    
    if (profileError) {
        console.error(`[Middleware DEBUG] Fetch Error for ${user.email}:`, profileError.message);
    }

    const role = profile?.role || 'teacher';
    console.log(`[Middleware DEBUG] User: ${user.email} | DB Role: ${profile?.role || 'NULL'} | Final Role: ${role}`);

    const isAdmin = role === 'admin';
    const isHeadmaster = role === 'headmaster';

    // Rute akar: Redirect berdasarkan role
    if (pathname === '/') {
        const dest = isAdmin ? '/admin' : '/dashboard';
        return NextResponse.redirect(new URL(dest, request.url));
    }

    // Proteksi rute Admin
    if (pathname.startsWith('/admin')) {
      if (isAdmin) return response;

      const isAllowedMonitoring = pathname.startsWith('/admin/teacher-attendance') || pathname.startsWith('/admin/teacher-activity');
      if (isHeadmaster && isAllowedMonitoring) return response;

      console.warn(`[Middleware DEBUG] Access DENIED for ${user.email}. Role '${role}' unauthorized for ${pathname}`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    if (pathname === '/dashboard' && isAdmin) {
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
