import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secretKey = process.env.JWT_SECRET || "super-secret-hui-key-2026-very-secure-must-be-long-enough"
const key = new TextEncoder().encode(secretKey)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  if (pathname === '/login' || pathname === '/register') {
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get('session')?.value

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const { payload } = await jwtVerify(sessionCookie, key, { algorithms: ["HS256"] })
    
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.userId as string)
    requestHeaders.set('x-user-role', payload.role as string)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('session')
    return response
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
