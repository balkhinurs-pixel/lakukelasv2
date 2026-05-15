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

  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/monitoring') || pathname === '/activate')) {
      return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (user) {
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_activated')
        .eq('id', user.id)
        .maybeSingle();

    // Jika profil belum ada (proses trigger di DB mungkin butuh sedetik), 
    // atau jika user login via google dan baru pertama kali.
    const isActivated = profile?.is_activated ?? false;
    const role = profile?.role || 'teacher';
    const isAdmin = role === 'admin';
    const isHeadmaster = role === 'headmaster';

    // Rute aktivasi: Jika sudah aktif, jangan boleh balik ke /activate
    if (pathname === '/activate' && isActivated) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Gatekeeper Aktivasi: Jika belum aktif, paksa ke /activate (kecuali user adalah admin pertama)
    if (!isActivated && pathname !== '/activate' && !pathname.startsWith('/auth') && pathname !== '/' && pathname !== '/login') {
        return NextResponse.redirect(new URL('/activate', request.url));
    }

    // Rute akar: Redirect berdasarkan role
    if (pathname === '/') {
        if (isAdmin) return NextResponse.redirect(new URL('/admin', request.url));
        if (isHeadmaster) return NextResponse.redirect(new URL('/monitoring', request.url));
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Proteksi rute Admin: Hanya untuk role 'admin'
    if (pathname.startsWith('/admin')) {
      if (!isAdmin) {
        return NextResponse.redirect(new URL(isHeadmaster ? '/monitoring' : '/dashboard', request.url));
      }
    }

    // Proteksi rute Monitoring: Untuk Admin DAN Headmaster
    if (pathname.startsWith('/monitoring')) {
      if (!isAdmin && !isHeadmaster) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}