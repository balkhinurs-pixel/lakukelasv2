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

  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/monitoring'))) {
      return NextResponse.redirect(new URL('/', request.url));
  }
  
  if (user) {
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', user.id)
        .single();

    const role = profile?.role || 'teacher';
    const isAdmin = role === 'admin';
    const isHeadmaster = role === 'headmaster';

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
    
    // Redirect Admin agar tidak masuk ke dashboard guru (opsional, tergantung preferensi)
    if (pathname === '/dashboard' && isAdmin) {
        // Biarkan tetap di dashboard jika dia ingin melihat sisi guru, 
        // tapi middleware default kita mengizinkan
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
