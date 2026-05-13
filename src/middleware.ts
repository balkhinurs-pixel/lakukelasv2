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
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', user.id)
        .single();
    
    if (profileError) {
        console.error(`[Middleware DEBUG] Fetch Error for ${user.email}:`, profileError.message);
    }

    if (!profile) {
      console.warn(`[Middleware DEBUG] Profile MISSING for ${user.email}.`);
    }

    const role = profile?.role || 'teacher';
    const isAdmin = role === 'admin';
    const isHeadmaster = role === 'headmaster';

    // Rute akar: Redirect berdasarkan role
    if (pathname === '/') {
        const dest = isAdmin ? '/admin' : '/dashboard';
        return NextResponse.redirect(new URL(dest, request.url));
    }

    // Proteksi rute Admin
    if (pathname.startsWith('/admin')) {
      // Admin punya akses penuh
      if (isAdmin) return response;

      // Izinkan headmaster melihat menu tertentu di /admin
      const isAllowedMonitoring = pathname === '/admin' || pathname.startsWith('/admin/teacher-attendance') || pathname.startsWith('/admin/teacher-activity');
      
      // Jika Headmaster mencoba akses rute admin lain (users, settings, roster), tolak
      if (isHeadmaster) {
          if (isAllowedMonitoring) return response;
          return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      console.warn(`[Middleware DEBUG] Access DENIED for ${user.email}. Role '${role}' unauthorized for ${pathname}`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Redirect Admin agar tidak masuk ke dashboard guru (karena admin tidak mengajar)
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
