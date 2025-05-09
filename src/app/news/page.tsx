// src/app/news/page.tsx
'use client';
import { useSession } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Article {
  id: string;
  title: string;
  summary: string;
  date: string;
  city: string;
  state: string;
  url: string;
  content: string;
  source_url: string;
}

export default function NewsPage() {
  const session = useSession();
  const router = useRouter();
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      router.push('/login');
    }
  }, [session, router]);

  useEffect(() => {
    // Fetch articles from your JSON file
    fetch('/data/articles.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch articles: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        console.log(`Loaded ${data.length} articles from JSON`);
        setArticles(data || []);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading articles:', error);
        setError(error.message);
        setLoading(false);
      });
  }, []);

  if (!session) return null;
  
  if (loading) return (
    <main className="min-h-screen bg-[#1e1e2f] text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Real Estate News</h1>
      <p>Loading news articles...</p>
    </main>
  );

  if (error) return (
    <main className="min-h-screen bg-[#1e1e2f] text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Real Estate News</h1>
      <p className="text-red-400">Error loading articles: {error}</p>
      <p className="mt-4">Please make sure you've run the export script to create the articles JSON file.</p>
    </main>
  );

  const filteredNews = articles
    .filter((item) =>
      (item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
       item.summary?.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (stateFilter === '' || item.state === stateFilter) &&
      (cityFilter === '' || item.city?.toLowerCase().includes(cityFilter.toLowerCase()))
    )
    .sort((a, b) => {
      return sortOrder === 'newest'
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : new Date(a.date).getTime() - new Date(b.date).getTime();
    });

  const uniqueStates = Array.from(new Set(articles.filter(item => item.state).map((item) => item.state)));

  return (
    <main className="min-h-screen bg-[#1e1e2f] text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Real Estate News</h1>
      
      {articles.length === 0 ? (
        <p className="text-yellow-400 mb-6">No articles found. Please run the export script to create the articles JSON file.</p>
      ) : (
        <p className="text-gray-400 mb-6">Found {articles.length} articles. Showing {filteredNews.length} after filtering.</p>
      )}
      
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
        {filteredNews.length > 0 ? (
          filteredNews.map((item) => (
            <Link
              key={item.id}
              href={`/news/${item.id}`}
              className="block p-4 bg-[#2a2a3d] rounded-lg hover:bg-[#3a3a50] transition"
            >
              <div className="flex flex-wrap justify-between items-center">
                <span className="text-sm text-gray-400">{new Date(item.date).toDateString()}</span>
                <span className="text-sm text-gray-400">{item.city}, {item.state}</span>
              </div>
              <h3 className="font-medium text-blue-300 text-lg mb-1">{item.title}</h3>
              <p className="mt-2 text-gray-300">{item.summary}</p>
            </Link>
          ))
        ) : (
          <p className="text-gray-400">No articles match your search criteria.</p>
        )}
      </div>
    </main>
  );
}