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
    // 2. Ambil profile langsung dari database setiap request untuk memastikan role terbaru
    // Query ini harus ringan dan tidak boleh terhambat RLS loop
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    
    // Jika profil tidak ditemukan, mungkin user baru. Biarkan masuk ke dashboard untuk trigger pembuatan profil
    const role = profile?.role || 'teacher';
    const isAdmin = role === 'admin';
    const isHeadmaster = role === 'headmaster';

    // 3. Rute akar: Redirect berdasarkan role
    if (pathname === '/') {
        if (isAdmin) {
            return NextResponse.redirect(new URL('/admin', request.url));
        } else {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    // 4. Proteksi rute Admin
    if (pathname.startsWith('/admin')) {
      if (!isAdmin) {
        // Headmaster boleh akses laporan tertentu di admin
        const allowedForHeadmaster = pathname.startsWith('/admin/teacher-attendance') || pathname.startsWith('/admin/teacher-activity');
        
        if (isHeadmaster && allowedForHeadmaster) {
          return response;
        }
        
        // Selain itu, guru biasa tidak boleh ke /admin
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    
    // 5. Redirect Admin agar tidak masuk ke dashboard Guru secara default (opsional)
    if (pathname.startsWith('/dashboard') && isAdmin && pathname === '/dashboard') {
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