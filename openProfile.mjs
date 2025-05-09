// openProfile.mjs
import { chromium } from 'playwright';

const start = async () => {
  const browser = await chromium.launchPersistentContext('./chrome-profile', {
    headless: false,
    channel: 'chrome',
  });

  const page = await browser.newPage();
  await page.goto('https://www.axios.com/local/dallas/news');

  console.log("✅ Browser opened. Please accept cookies, scroll, click a few articles, then close manually when done.");
};

start();
