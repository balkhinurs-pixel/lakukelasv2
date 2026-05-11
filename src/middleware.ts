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
    
    const role = profile?.role;
    const isAdmin = role === 'admin';
    const isHeadmaster = role === 'headmaster';

    // If a logged-in user is on the root login page, redirect them to their respective dashboard
    if (pathname === '/') {
        if (isAdmin) {
            return NextResponse.redirect(new URL('/admin', request.url));
        } else {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    // Role-based access control for /admin
    if (pathname.startsWith('/admin')) {
      if (!isAdmin) {
        // Special case for headmasters who can access monitoring reports in admin area
        const allowedForHeadmaster = pathname.startsWith('/admin/teacher-attendance') || pathname.startsWith('/admin/teacher-activity');
        
        if (isHeadmaster && allowedForHeadmaster) {
          return response;
        }
        
        // Everyone else (Teachers or Headmasters on other admin pages) gets sent to teacher dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    
    // Admins should not be in /dashboard (they have their own /admin)
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
