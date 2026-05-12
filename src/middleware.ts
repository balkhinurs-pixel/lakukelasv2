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

  // Ambil user dari session
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl

  // 1. Proteksi rute dasar: Jika belum login, tendang ke login page
  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
      return NextResponse.redirect(new URL('/', request.url));
  }
  
  if (user) {
    // 2. Ambil profile langsung dari database
    // Menggunakan select minimal untuk performa
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    
    // Default role jika profile belum terbuat (sedang proses trigger)
    const role = profile?.role || 'teacher';
    const isAdmin = role === 'admin';
    const isHeadmaster = role === 'headmaster';

    // 3. Rute akar: Redirect berdasarkan role
    if (pathname === '/') {
        return NextResponse.redirect(new URL(isAdmin ? '/admin' : '/dashboard', request.url));
    }

    // 4. Proteksi rute Admin
    if (pathname.startsWith('/admin')) {
      // Izinkan jika dia Admin sejati
      if (isAdmin) return response;

      // Izinkan Headmaster untuk rute pemantauan saja
      const isAllowedMonitoring = pathname.startsWith('/admin/teacher-attendance') || pathname.startsWith('/admin/teacher-activity');
      if (isHeadmaster && isAllowedMonitoring) return response;

      // Selain itu, tendang balik ke dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // 5. Redirect Admin agar tidak masuk ke dashboard Guru secara default
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
