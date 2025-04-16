// src/app/news/[id]/page.tsx
import { supabase } from '@/lib/supabaseClient';
import { notFound } from 'next/navigation';

export default async function NewsArticlePage({ params }: { params: { id: string } }) {
  const { data: article, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!article || error) return notFound();

  return (
    <main className="min-h-screen bg-[#1e1e2f] text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-300 mb-2">{article.title}</h1>
        <p className="text-sm text-gray-400 mb-4">{article.date} — {article.city}, {article.state}</p>
        <p className="text-lg text-gray-200 whitespace-pre-line mb-6">{article.content}</p>
        <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
          Read original source
        </a>
      </div>
    </main>
  );
}
