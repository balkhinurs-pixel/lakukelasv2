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

  // If user is not logged in, and tries to access a protected route, redirect to login
  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
      return NextResponse.redirect(new URL('/', request.url));
  }
  
  // If user is logged in, handle role-based routing
  if (user) {
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    
    const isAdmin = profile?.role === 'admin';

    // If a logged-in user is on the login page, redirect them to their respective dashboard
    if (pathname === '/') {
        if (isAdmin) {
            return NextResponse.redirect(new URL('/admin', request.url));
        } else {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    // If a non-admin tries to access admin routes, redirect to teacher dashboard
    if (pathname.startsWith('/admin') && !isAdmin) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // If an admin tries to access teacher dashboard routes, redirect to admin dashboard
    if (pathname.startsWith('/dashboard') && isAdmin) {
        return NextResponse.redirect(new URL('/admin', request.url));
    }
  }


  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
