import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// This would typically come from a database
const validUsers = [
  {
    id: '1',
    email: 'test@example.com',
    password: 'password123', // In a real app, NEVER store plain text passwords
    name: 'Test User'
  }
];

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Use environment variable in production

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received login request with email:', body.email);
    
    const { email, password } = body;
    
    // Find user (in a real app, query your database)
    const user = validUsers.find(u => u.email === email);
    console.log('User found:', user ? 'Yes' : 'No');
    
    // Check if user exists and password is correct
    if (!user || user.password !== password) {
      console.log('Invalid credentials');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    console.log('Creating JWT token');
    
    // Create a JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
      },
      JWT_SECRET
    );
    
    console.log('JWT token created successfully');
    
    // Create response with user data
    const responseData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      token // Include token in response for compatibility
    };
    
    // Create the response
    const response = NextResponse.json(responseData);
    
    // Set a session cookie
    response.cookies.set({
      name: 'auth_session',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 24 hours
      sameSite: 'strict'
    });
    
    console.log('Sending response with cookie');
    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}