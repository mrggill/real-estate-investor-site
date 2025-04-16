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
    const headline = $(el).find('.title').text().trim();
    const link = 'https://www.dallasecodev.org' + $(el).find('a').attr('href');
    const dateText = $(el).find('.date').text().trim();
    const date = new Date(dateText);

    articles.push({
      title: headline,
      url: link,
      date: date.toISOString().split('T')[0],
      city: 'Dallas',
      state: 'TX',
    });
  });

  for (const article of articles) {
    const { error } = await supabase
      .from('news_articles')
      .insert([article]);

    if (error) {
      console.error('Insert error:', error);
    } else {
      console.log('Inserted:', article.title);
    }
  }
};

scrapeDallasNews();
