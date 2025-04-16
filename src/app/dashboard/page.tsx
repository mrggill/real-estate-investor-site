// src/app/dashboard/page.tsx
'use client';

import { useSession } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session) {
      router.push('/login');
    }
  }, [session, router]);

  if (!session) return null;

  return (
    <div className="flex min-h-screen bg-[#1e1e2f] text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-[#2a2a3d] p-6 space-y-6">
        <h2 className="text-xl font-bold">RE Terminal</h2>
        <nav className="flex flex-col space-y-2">
          <Link href="/dashboard" className="hover:bg-[#3a3a50] px-4 py-2 rounded">Dashboard</Link>
          <Link href="/news" className="hover:bg-[#3a3a50] px-4 py-2 rounded">News</Link>
          <Link href="/map" className="hover:bg-[#3a3a50] px-4 py-2 rounded">Map</Link>
          <Link href="/login" className="hover:bg-[#3a3a50] px-4 py-2 rounded">Logout</Link>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-8">Welcome, {session.user.email}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-[#2a2a3d] p-6 rounded-xl shadow hover:shadow-lg transition cursor-pointer">
            <h2 className="text-xl font-semibold text-blue-400 mb-2">Saved Properties</h2>
            <p className="text-gray-300 text-sm">View and manage your bookmarked properties.</p>
          </div>

          <div className="bg-[#2a2a3d] p-6 rounded-xl shadow hover:shadow-lg transition cursor-pointer">
            <h2 className="text-xl font-semibold text-green-400 mb-2">Market Insights</h2>
            <p className="text-gray-300 text-sm">Check local rental rates, price trends, and yields.</p>
          </div>

          <div className="bg-[#2a2a3d] p-6 rounded-xl shadow hover:shadow-lg transition cursor-pointer">
            <h2 className="text-xl font-semibold text-purple-400 mb-2">Recent Activity</h2>
            <p className="text-gray-300 text-sm">See your latest saved listings, views, and more.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
