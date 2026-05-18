
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

  // 1. Jika tidak login, paksa ke /login
  if (!user && (
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/admin') || 
    pathname.startsWith('/monitoring') || 
    pathname === '/waiting-approval' || 
    pathname === '/complete-profile'
  )) {
      return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (user) {
    // Ambil data profil dasar
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_activated, full_name')
        .eq('id', user.id)
        .maybeSingle();

    const role = profile?.role || 'teacher';
    const isAdmin = role === 'admin';
    const isHeadmaster = role === 'headmaster';
    const isActivated = profile?.is_activated ?? false;
    const hasFilledProfile = profile?.full_name && profile.full_name !== 'User LakuKelas' && profile.full_name !== 'Administrator LakuKelas';

    // ==========================================================
    // A. LOGIKA PRIORITAS ADMIN (SOLUSI TOTAL)
    // ==========================================================
    if (isAdmin) {
      // Jika Admin mencoba akses halaman publik, login, atau halaman "persiapan", 
      // langsung lempar ke dashboard admin.
      if (pathname === '/' || pathname === '/login' || pathname === '/complete-profile' || pathname === '/waiting-approval') {
        return NextResponse.redirect(new URL('/admin/users', request.url));
      }
      // Izinkan Admin mengakses semua rute /admin/*
      return response;
    }

    // ==========================================================
    // B. LOGIKA GURU & KEPALA SEKOLAH
    // ==========================================================
    
    // 1. Jika sudah aktif, jangan biarkan kembali ke halaman persiapan
    if (isActivated && (pathname === '/waiting-approval' || pathname === '/complete-profile' || pathname === '/login' || pathname === '/')) {
        if (isHeadmaster) return NextResponse.redirect(new URL('/monitoring', request.url));
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // 2. Proteksi rute root (/)
    if (pathname === '/') {
        if (isHeadmaster && isActivated) return NextResponse.redirect(new URL('/monitoring', request.url));
        if (isActivated) return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // 3. Gatekeeper untuk yang belum aktif (Hanya untuk non-Admin)
    if (!isActivated && !pathname.startsWith('/auth') && pathname !== '/' && pathname !== '/login') {
        // Belum isi data diri -> paksa isi
        if (!hasFilledProfile && pathname !== '/complete-profile') {
            return NextResponse.redirect(new URL('/complete-profile', request.url));
        }
        // Sudah isi data tapi belum disetujui -> paksa tunggu
        if (hasFilledProfile && pathname !== '/waiting-approval') {
            return NextResponse.redirect(new URL('/waiting-approval', request.url));
        }
    }

    // 4. Proteksi Hak Akses Folder
    if (pathname.startsWith('/admin') && !isAdmin) {
        return NextResponse.redirect(new URL(isHeadmaster ? '/monitoring' : '/dashboard', request.url));
    }

    if (pathname.startsWith('/monitoring') && !isAdmin && !isHeadmaster) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
