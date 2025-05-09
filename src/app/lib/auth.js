// /src/app/lib/auth.js
"use client";

export function login(token, userData) {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('user_data', JSON.stringify(userData));
  
  // Dispatch storage event to notify other tabs
  window.dispatchEvent(new Event('storage'));
}

export function logout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
  
  // Call logout API
  fetch('/api/auth/logout', {
    method: 'POST'
  }).catch(error => {
    console.error('Logout failed:', error);
  });
  
  // Dispatch storage event to notify other tabs
  window.dispatchEvent(new Event('storage'));
}

export function isLoggedIn() {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (!token) return false;
    
    try {
      // Verify token hasn't expired
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (tokenData.exp && tokenData.exp < currentTime) {
        // Token expired, clean up
        logout();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error verifying token:', error);
      return false;
    }
  }
  return false;
}

export function getUser() {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }
  return null;
}

export function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}