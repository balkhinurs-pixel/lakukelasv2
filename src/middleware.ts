
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

  const { data: { session } } = await supabase.auth.getSession()
  
  // If user is not logged in, protect dashboard/admin routes
  if (!session) {
    if (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return response;
  }

  // --- User is logged in, handle redirections ---
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();
  
  const isAdmin = profile?.role === 'admin';
  const isTeacher = profile?.role === 'teacher';
  const currentPath = request.nextUrl.pathname;

  // If a logged-in user tries to access the login page, redirect them
  if (currentPath === '/') {
    if (isAdmin) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    if (isTeacher) {
       return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Protect admin routes: only admins can access them
  if (currentPath.startsWith('/admin') && !isAdmin) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Protect teacher dashboard: redirect admins away from it
  if (currentPath.startsWith('/dashboard') && isAdmin) {
    return NextResponse.redirect(new URL('/admin', request.url));
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
