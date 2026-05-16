
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

  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/monitoring') || pathname === '/waiting-approval' || pathname === '/complete-profile')) {
      return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (user) {
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_activated, full_name')
        .eq('id', user.id)
        .maybeSingle();

    const isActivated = profile?.is_activated ?? false;
    const role = profile?.role || 'teacher';
    const isAdmin = role === 'admin';
    const isHeadmaster = role === 'headmaster';
    
    // Deteksi apakah user sudah mengisi data diri
    const hasFilledProfile = profile?.full_name && profile.full_name !== 'User LakuKelas';

    // Rute Tunggu & Lengkapi Profil: Jika sudah aktif atau Admin, jangan boleh ke sana
    if ((pathname === '/waiting-approval' || pathname === '/complete-profile') && (isActivated || isAdmin)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Gatekeeper Approval: Hanya untuk non-Admin & non-Aktif
    if (!isAdmin && !isActivated && !pathname.startsWith('/auth') && pathname !== '/' && pathname !== '/login') {
        // 1. Jika belum isi data diri, paksa ke /complete-profile
        if (!hasFilledProfile && pathname !== '/complete-profile') {
            return NextResponse.redirect(new URL('/complete-profile', request.url));
        }
        // 2. Jika sudah isi data diri tapi belum disetujui, paksa ke /waiting-approval
        if (hasFilledProfile && pathname !== '/waiting-approval') {
            return NextResponse.redirect(new URL('/waiting-approval', request.url));
        }
    }

    // Rute akar: Redirect berdasarkan role
    if (pathname === '/') {
        if (isAdmin) return NextResponse.redirect(new URL('/admin', request.url));
        if (isHeadmaster) return NextResponse.redirect(new URL('/monitoring', request.url));
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Proteksi rute Admin
    if (pathname.startsWith('/admin')) {
      if (!isAdmin) {
        return NextResponse.redirect(new URL(isHeadmaster ? '/monitoring' : '/dashboard', request.url));
      }
    }

    // Proteksi rute Monitoring
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
