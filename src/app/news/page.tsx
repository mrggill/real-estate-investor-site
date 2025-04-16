// src/app/news/page.tsx
'use client';

import { useSession } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const newsList = [
  {
    id: 'toronto-rent-control-investors',
    date: '2025-04-14',
    city: 'Toronto',
    state: 'ON',
    summary: 'Rent control rollback drives investor rush into multi-unit housing.',
  },
  {
    id: 'vancouver-housing-starts-down',
    date: '2025-04-13',
    city: 'Vancouver',
    state: 'BC',
    summary: 'Housing starts drop 12% in Q1 as developers pause due to interest rates.',
  },
  {
    id: 'houston-migration-surges',
    date: '2025-04-12',
    city: 'Houston',
    state: 'TX',
    summary: 'Houston tops U.S. cities for net migration for third month straight.',
  },
];

export default function NewsPage() {
  const session = useSession();
  const router = useRouter();

  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  useEffect(() => {
    if (!session) {
      router.push('/login');
    }
  }, [session, router]);

  if (!session) return null;

  const filteredNews = newsList
    .filter((item) =>
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (stateFilter === '' || item.state === stateFilter) &&
      (cityFilter === '' || item.city.toLowerCase().includes(cityFilter.toLowerCase()))
    )
    .sort((a, b) => {
      return sortOrder === 'newest'
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : new Date(a.date).getTime() - new Date(b.date).getTime();
    });

  const uniqueStates = Array.from(new Set(newsList.map((item) => item.state)));

  return (
    <main className="min-h-screen bg-[#1e1e2f] text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Real Estate News</h1>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search news..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 rounded-md bg-[#2a2a3d] text-white placeholder-gray-400"
        />

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
          className="px-4 py-2 rounded-md bg-[#2a2a3d] text-white"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>

        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="px-4 py-2 rounded-md bg-[#2a2a3d] text-white"
        >
          <option value="">All States</option>
          {uniqueStates.map((state) => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="City/Region filter..."
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="px-4 py-2 rounded-md bg-[#2a2a3d] text-white placeholder-gray-400"
        />
      </div>

      <div className="space-y-4">
        {filteredNews.map((item) => (
          <Link
            key={item.id}
            href={`/news/${item.id}`}
            className="block p-4 bg-[#2a2a3d] rounded-lg hover:bg-[#3a3a50] transition"
          >
            <div className="flex flex-wrap justify-between items-center">
              <span className="text-sm text-gray-400">{new Date(item.date).toDateString()}</span>
              <span className="text-sm text-gray-400">{item.city}, {item.state}</span>
            </div>
            <p className="mt-2 text-lg text-blue-300">{item.summary}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
