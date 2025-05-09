// src/components/Navbar.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ResponsiveContainer from './ResponsiveContainer';
import { isLoggedIn, getUser, logout } from '../app/lib/auth';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const pathname = usePathname();
  
  useEffect(() => {
    // Check login status
    const checkLoginStatus = () => {
      const loggedIn = isLoggedIn();
      setUserLoggedIn(loggedIn);
      
      if (loggedIn) {
        const user = getUser();
        setUserName(user?.name || 'User');
      }
    };
    
    // Initial check
    checkLoginStatus();
    
    // Add listener for storage events (for multi-tab sync)
    window.addEventListener('storage', checkLoginStatus);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, []);
  
  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'News', href: '/news' },
    { name: 'Dashboard', href: '/dashboard' },
  ];
  
  // Get initials for avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  const handleLogout = () => {
    logout();
    setUserLoggedIn(false);
  };
  
  const isActive = (path) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };
  
  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <ResponsiveContainer>
        <nav className="flex items-center justify-between py-4">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-blue-600">Real Estate Investor</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
          
          <div className="flex items-center">
            {/* Conditionally render login or logout */}
            {!userLoggedIn ? (
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                Login Now
              </Link>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                    {getInitials(userName)}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline-block">{userName}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
            
            {/* Mobile menu button */}
            <button
              type="button"
              className="ml-4 md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </nav>
      </ResponsiveContainer>
      
      {/* Mobile menu */}
      <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 bg-white shadow-lg">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive(item.href)
                  ? 'text-blue-600 bg-gray-100'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          
          {/* Add logout to mobile menu when logged in */}
          {userLoggedIn && (
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
}