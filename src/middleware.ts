
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Optimized Middleware:
 * Hanya melakukan verifikasi Sesi Auth (Wajib Login).
 * Logika detail profil (is_activated/role) dipindahkan ke Layout untuk 
 * performa akses aset yang jauh lebih cepat.
 */
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

  // 1. Proteksi Halaman Dashboard & Admin (Wajib Login)
  if (!user && (
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/admin') || 
    pathname.startsWith('/monitoring') || 
    pathname === '/waiting-approval' || 
    pathname === '/complete-profile'
  )) {
      return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // 2. Jika sudah login, jangan biarkan ke halaman login/welcome
  if (user && (pathname === '/login' || pathname === '/')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
