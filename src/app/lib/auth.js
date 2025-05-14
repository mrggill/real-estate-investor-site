"use client";

export async function login(token, userData) {
  // Store user data in localStorage for easy access on client
  localStorage.setItem('user_data', JSON.stringify(userData));
  
  // Set a flag to indicate logged in status
  localStorage.setItem('is_logged_in', 'true');
  
  // Dispatch storage event to notify other tabs
  window.dispatchEvent(new Event('storage'));
}

export function logout() {
  localStorage.removeItem('user_data');
  localStorage.removeItem('is_logged_in');
  
  // Call logout API to clear server-side cookies
  fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include' // Important for cookies
  }).catch(error => {
    console.error('Logout failed:', error);
  });
  
  // Dispatch storage event to notify other tabs
  window.dispatchEvent(new Event('storage'));
}

export function isLoggedIn() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('is_logged_in') === 'true';
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