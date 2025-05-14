import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Create a response
    const response = NextResponse.json({ success: true });
    
    // Clear the auth cookie
    response.cookies.set({
      name: 'auth_session',
      value: '',
      httpOnly: true,
      expires: new Date(0), // Expire immediately
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}