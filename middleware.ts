import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_session')?.value;
  
  // If the token doesn't exist and the route is protected
  if (!token && isProtectedRoute(request.nextUrl.pathname)) {
    // Redirect to the login page
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If we have a token, verify it
  if (token) {
    try {
      // Using jose for JWT verification in Edge environment
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || 'your-secret-key'
      );
      
      const { payload } = await jwtVerify(token, secret);
      
      // If we're already logged in and trying to access login page, redirect to dashboard
      if (request.nextUrl.pathname === '/login') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (error) {
      // If token verification fails and route is protected, redirect to login
      if (isProtectedRoute(request.nextUrl.pathname)) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
  }
  
  return NextResponse.next();
}

// Define which routes are protected
function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = ['/dashboard'];
  return protectedRoutes.some(route => pathname.startsWith(route));
}

// Configure middleware to run on specific paths
export const config = {
  matcher: ['/dashboard/:path*', '/login']
};