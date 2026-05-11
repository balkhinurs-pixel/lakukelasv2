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

  // Proteksi rute: Jika belum login, tendang ke login page
  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
      return NextResponse.redirect(new URL('/', request.url));
  }
  
  if (user) {
    // Ambil profile langsung dari database setiap request untuk memastikan role terbaru
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    
    const role = profile?.role;
    const isAdmin = role === 'admin';
    const isHeadmaster = role === 'headmaster';

    // Rute akar: Redirect berdasarkan role
    if (pathname === '/') {
        if (isAdmin) {
            return NextResponse.redirect(new URL('/admin', request.url));
        } else {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    // Proteksi Admin: Hanya Admin (dan Headmaster untuk laporan tertentu) yang boleh masuk /admin
    if (pathname.startsWith('/admin')) {
      if (!isAdmin) {
        const allowedForHeadmaster = pathname.startsWith('/admin/teacher-attendance') || pathname.startsWith('/admin/teacher-activity');
        
        if (isHeadmaster && allowedForHeadmaster) {
          return response;
        }
        
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    
    // Redirect Admin agar tidak masuk ke dashboard Guru (opsional)
    if (pathname.startsWith('/dashboard') && isAdmin) {
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
