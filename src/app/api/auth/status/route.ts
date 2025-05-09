// /src/app/api/auth/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Use environment variable in production

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = cookies().get('auth_session')?.value;
    
    if (!token) {
      return NextResponse.json({ authenticated: false });
    }
    
    // Verify token
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return NextResponse.json({ 
        authenticated: true,
        user: decoded
      });
    } catch (err) {
      // Token is invalid
      cookies().delete('auth_session');
      return NextResponse.json({ authenticated: false });
    }
  } catch (error) {
    console.error('Auth status check error:', error);
    return NextResponse.json({ authenticated: false });
  }
}