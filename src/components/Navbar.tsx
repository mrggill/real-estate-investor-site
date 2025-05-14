"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Bars3Icon, 
  XMarkIcon, 
  SunIcon, 
  MoonIcon,
  HomeIcon,
  NewspaperIcon,
  CalculatorIcon,
  UserIcon
} from '@heroicons/react/24/outline';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Check for dark mode preference
    try {
      const storedDarkMode = localStorage.getItem('darkMode') === 'true';
      setIsDarkMode(storedDarkMode);
      
      if (storedDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (err) {
      console.error('Error accessing localStorage:', err);
    }
  }, []);

  const toggleDarkMode = () => {
    try {
      const newDarkMode = !isDarkMode;
      setIsDarkMode(newDarkMode);
      localStorage.setItem('darkMode', String(newDarkMode));
      
      if (newDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (err) {
      console.error('Error setting localStorage:', err);
    }
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">RE</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white ml-1">Invest</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <Link 
              href="/"
              className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                pathname === '/' 
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white'
              }`}
            >
              <HomeIcon className="h-5 w-5 mr-1" />
              Home
            </Link>
            
            <Link 
              href="/news"
              className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                pathname?.startsWith('/news') 
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white'
              }`}
            >
              <NewspaperIcon className="h-5 w-5 mr-1" />
              News
            </Link>
            
            <Link 
              href="/listings"
              className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                pathname?.startsWith('/listings') 
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white'
              }`}
            >
              <HomeIcon className="h-5 w-5 mr-1" />
              Properties
            </Link>
            
            <Link 
              href="/tools"
              className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                pathname?.startsWith('/tools') 
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white'
              }`}
            >
              <CalculatorIcon className="h-5 w-5 mr-1" />
              Tools
            </Link>
            
            <button
              type="button"
              onClick={toggleDarkMode}
              className="inline-flex items-center p-2 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {isDarkMode ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>
            
            <Link
              href="/signin"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <UserIcon className="h-5 w-5 mr-1" />
              Sign In
            </Link>
            
            <Link
              href="/signup"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Sign Up
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link
            href="/"
            className={`block pl-3 pr-4 py-2 text-base font-medium ${
              pathname === '/'
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-l-4 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            Home
          </Link>
          
          <Link
            href="/news"
            className={`block pl-3 pr-4 py-2 text-base font-medium ${
              pathname?.startsWith('/news')
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-l-4 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            News
          </Link>
          
          <Link
            href="/listings"
            className={`block pl-3 pr-4 py-2 text-base font-medium ${
              pathname?.startsWith('/listings')
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-l-4 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            Properties
          </Link>
          
          <Link
            href="/tools"
            className={`block pl-3 pr-4 py-2 text-base font-medium ${
              pathname?.startsWith('/tools')
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-l-4 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            Tools
          </Link>
        </div>
        
        <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <button
                  type="button"
                  onClick={toggleDarkMode}
                  className="inline-flex items-center p-2 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {isDarkMode ? (
                    <SunIcon className="h-5 w-5" />
                  ) : (
                    <MoonIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/signin"
                className="block px-4 py-2 text-base font-medium text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Sign In
              </Link>
              
              <Link
                href="/signup"
                className="block px-4 py-2 text-base font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}