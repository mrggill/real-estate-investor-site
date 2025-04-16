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

  $('a[id^="alertTitle_"]').each((i, el) => {
    const headline = $(el).text().trim();
    const relativeLink = $(el).attr('href');
    const link = `https://www.dallasecodev.org${relativeLink}`;
    const parent = $(el).closest('.item, .catAgendaItem');
    let dateText = parent.find('.date').text().trim().replace('Posted on: ', '');

    // remove any trailing "| Last Modified on" parts
    if (dateText.includes('|')) {
      dateText = dateText.split('|')[0].trim();
    }

    const parsedDate = new Date(dateText);
    console.log(`Scraping: "${headline}" - Raw date: "${dateText}"`);

    if (!headline || isNaN(parsedDate)) {
      console.warn(`⚠️ Skipping article: "${headline}" - Invalid title or date.`);
      return;
    }

    articles.push({
      title: headline,
      url: link,
      date: parsedDate.toISOString().split('T')[0], // YYYY-MM-DD
      city: 'Dallas',
      state: 'TX',
    });
  });

  for (const article of articles) {
    const { error, data } = await supabase
      .from('news_articles')
      .upsert(article, { onConflict: ['url'] });

    if (error) {
      console.error('❌ Insert error:', JSON.stringify(error, null, 2), '\nArticle:', article);
    } else {
      console.log(`✅ Inserted/Updated: ${article.title}`);
    }
  }

  console.log(`🎉 Finished processing ${articles.length} articles.`);
};

scrapeDallasNews();
