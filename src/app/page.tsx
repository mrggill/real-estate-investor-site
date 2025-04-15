// src/app/page.tsx
'use client'

import { useSession } from '@supabase/auth-helpers-react'
import Link from 'next/link'

export default function HomePage() {
  const session = useSession()
  const isLoggedIn = !!session

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold">Welcome to RE Investor</h2>

      {!isLoggedIn ? (
        <div className="relative">
          <div className="blur-sm p-6 bg-white rounded-lg shadow">
            <p className="text-gray-700">
              Please log in to see the latest news, data dashboard, and interactive map.
            </p>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Link
              href="/login"
              className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer"
            >
              Log In
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-lg shadow cursor-pointer">News Feed</div>
          <div className="p-6 bg-white rounded-lg shadow cursor-pointer">Data Dashboard</div>
          <div className="p-6 bg-white rounded-lg shadow cursor-pointer">Map View</div>
        </div>
      )}
    </div>
  )
}

