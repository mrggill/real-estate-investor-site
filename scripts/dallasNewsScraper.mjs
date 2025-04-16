// scripts/dallasNewsScraper.mjs
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const scrapeDallasNews = async () => {
  const url = 'https://www.dallasecodev.org/CivicAlerts.aspx';

  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);

  const articles = [];

  $('.item').each((i, el) => {
    const anchor = $(el).find('a[id^="alertTitle_"]');
    const headline = anchor.text().trim();
    const link = 'https://www.dallasecodev.org' + anchor.attr('href');

    const rawDate = $(el).find('.date').text().trim();
    const cleanDate = rawDate.replace('Posted on:', '').split('|')[0].trim();
    const parsedDate = new Date(cleanDate);

    console.log(`Scraping: "${headline}" - Raw date: "${cleanDate}"`);

    if (!headline || isNaN(parsedDate)) {
      console.warn(`Invalid article - skipping. Headline: "${headline}"`);
      return;
    }

    articles.push({
      title: headline,
      url: link,
      date: parsedDate.toISOString().split('T')[0],
      city: 'Dallas',
      state: 'TX',
    });
  });

  for (const article of articles) {
    const { error } = await supabase.from('news_articles').insert([article]);

    if (error) {
      console.error('Insert error:', JSON.stringify(error, null, 2));
    } else {
      console.log('Inserted:', article.title);
    }
  }
};

scrapeDallasNews();
