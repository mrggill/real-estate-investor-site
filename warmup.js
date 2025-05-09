// warmup.js

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const run = async () => {
  const browser = await puppeteer.launch({
    headless: false, // VERY important: this shows the real browser
    userDataDir: './user_data', // This saves the session!
  });

  const page = await browser.newPage();
  await page.goto('https://www.axios.com/local/dallas/news', { waitUntil: 'networkidle0' });

  console.log('✅ Browser launched. Please manually browse, accept cookies and click a few articles...');
  console.log('⏳ Keep it open for about 30 seconds then close it manually when done.');

  // DO NOT close browser automatically
};

run();
