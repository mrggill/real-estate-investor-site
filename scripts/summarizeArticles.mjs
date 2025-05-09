// scripts/summarizeArticles.mjs
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const fetchReadableText = async (url) => {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const dom = new JSDOM(html);
    const text = dom.window.document.body.textContent;
    return text.replace(/\s+/g, ' ').trim().slice(0, 5000); // limit to first 5000 chars
  } catch (err) {
    console.error(`⚠️ Failed to fetch content from ${url}:`, err.message);
    return null;
  }
};

const generateSummary = async (text) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes real estate news articles into short, plain-English summaries.',
        },
        {
          role: 'user',
          content: `Summarize the following article in 1 paragraph:\n\n${text}`,
        },
      ],
    });
    return response.choices[0].message.content.trim();
  } catch (err) {
    console.error('❌ OpenAI API error:', err.message);
    return null;
  }
};

const summarizeArticles = async () => {
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, url')
    .is('summary', null);

  if (error) {
    console.error('❌ Failed to fetch articles:', error.message);
    return;
  }

  for (const article of articles) {
    console.log(`🔍 Summarizing: ${article.url}`);

    const content = await fetchReadableText(article.url);
    if (!content) continue;

    const summary = await generateSummary(content);
    if (!summary) continue;

    const { error: updateError } = await supabase
      .from('articles')
      .update({ summary })
      .eq('id', article.id);

    if (updateError) {
      console.error(`❌ Failed to update article ${article.id}:`, updateError.message);
    } else {
      console.log(`✅ Updated summary for article ${article.id}`);
    }
  }

  console.log('🎉 Done summarizing articles.');
};

summarizeArticles();
