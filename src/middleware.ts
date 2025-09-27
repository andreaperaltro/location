import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here if needed
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public routes
        const publicRoutes = ['/signin', '/auth/error', '/api/auth'];
        const isPublicRoute = publicRoutes.some(route => 
          req.nextUrl.pathname.startsWith(route)
        );
        
        if (isPublicRoute) {
          return true;
        }
        
        // Require authentication for all other routes
        return !!token;
      },
    },
    pages: {
      signIn: '/signin',
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
