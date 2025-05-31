// src/scrapers/utils/browser-utils.mjs
import { chromium } from 'playwright';
import { saveHtmlForDebugging } from './file-utils.mjs';
import { sleep } from './time-utils.mjs';

/**
 * Initialize and launch a browser instance
 * @param {boolean} headless - Whether to run in headless mode
 * @returns {Promise<Browser>} - Browser instance
 */
export const launchBrowser = async (headless = true) => {
  console.log(`🚀 Launching browser (headless: ${headless})...`);
  const browser = await chromium.launch({
    headless,
    args: [
      '--disable-dev-shm-usage',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
      '--disable-setuid-sandbox',
      '--no-sandbox'
    ]
  });
  
  console.log('✅ Browser launched successfully');
  return browser;
};

/**
 * Create a new browser context with realistic settings
 * @param {Browser} browser - Browser instance
 * @returns {Promise<BrowserContext>} - Browser context
 */
export const createBrowserContext = async (browser) => {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    deviceScaleFactor: 1,
  });
  
  // Set up realistic HTTP headers
  const page = await context.newPage();
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1'
  });
  
  return { context, page };
};

/**
 * Navigate to a URL with error handling
 * @param {Page} page - Playwright page object
 * @param {string} url - URL to navigate to
 * @param {string} siteName - Name of the site (for debugging)
 * @returns {Promise<boolean>} - True if navigation was successful
 */
export const navigateToPage = async (page, url, siteName) => {
  try {
    console.log(`🌐 Visiting ${siteName} at ${url}...`);
    
    const response = await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 60000
    });
    
    // Check if page loaded successfully
    const title = await page.title();
    console.log(`📑 Page title: "${title}"`);
    
    if (!title || title.includes('Error') || title.includes('Access Denied') || 
        response.status() >= 400) {
      throw new Error('Page did not load correctly');
    }
    
    console.log('✅ Page loaded successfully');
    console.log(`📄 Current URL: ${page.url()}`);
    await saveHtmlForDebugging(page, `${siteName.replace(/\s+/g, '_')}-initial-load`);
    
    return true;
  } catch (err) {
    console.error(`❌ Error navigating to ${url}: ${err.message}`);
    await saveHtmlForDebugging(page, 'navigation-error');
    return false;
  }
};

/**
 * Try different archive URLs for a site
 * @param {Page} page - Playwright page object
 * @param {string} baseUrl - Base URL for the site
 * @returns {Promise<boolean>} - True if an archive page was found
 */
export const tryArchiveUrls = async (page, baseUrl) => {
  try {
    const url = new URL(baseUrl);
    const possibleArchiveUrls = [
      new URL('/archives', url).toString(),
      new URL('/archive', url).toString(),
      new URL(baseUrl + '/archives').toString(),
      new URL(baseUrl + '/archive').toString()
    ];
    
    for (const archiveUrl of possibleArchiveUrls) {
      try {
        console.log(`🔍 Checking for archive page at ${archiveUrl}`);
        const response = await page.goto(archiveUrl, { 
          waitUntil: 'networkidle',
          timeout: 30000
        });
        
        if (response.status() >= 200 && response.status() < 300) {
          console.log(`✅ Found archive page at ${archiveUrl}`);
          return true;
        }
      } catch (archiveErr) {
        console.log(`⚠️ Archive page not found at ${archiveUrl}`);
      }
    }
    
    return false;
  } catch (err) {
    console.log(`⚠️ Error trying archive URLs: ${err.message}`);
    return false;
  }
};

/**
 * Handle cookie consent banners
 * @param {Page} page - Playwright page object
 * @returns {Promise<boolean>} - True if a cookie banner was handled
 */
export const handleCookieConsent = async (page) => {
  try {
    console.log('🍪 Checking for cookie consent banner...');
    const cookieSelectors = [
      'button:has-text("Accept")', 
      'button:has-text("Accept all")', 
      'button:has-text("I agree")',
      'button:has-text("Agree")',
      'button:has-text("OK")',
      'button:has-text("Continue")',
      'button[id*="cookie"][id*="accept"]',
      'button[class*="cookie"][class*="accept"]',
      'a:has-text("Accept")',
      'a:has-text("Accept all")'
    ];
    
    for (const selector of cookieSelectors) {
      const acceptButton = await page.$(selector);
      if (acceptButton) {
        await acceptButton.click();
        console.log(`🍪 Accepted cookies using selector: ${selector}`);
        await sleep(2000);
        return true;
      }
    }
    
    return false;
  } catch (err) {
    console.log('ℹ️ No cookie banner found or unable to click');
    return false;
  }
};

/**
 * Check if an element is in the viewport
 * @param {ElementHandle} elementHandle - Playwright element handle
 * @returns {Promise<boolean>} - True if element is in viewport
 */
export const isInViewport = async (elementHandle) => {
  return await elementHandle.evaluate(el => {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  });
};

/**
 * Click a "load more" button with fallback methods
 * @param {ElementHandle} button - Button element handle
 * @returns {Promise<boolean>} - True if click was successful
 */
export const clickLoadMoreButton = async (button) => {
  try {
    await button.click();
    console.log('✅ Successfully clicked button');
    await sleep(5000); // Wait for new content to load
    return true;
  } catch (clickErr) {
    console.log(`⚠️ Error clicking button: ${clickErr.message}`);
    
    // Try JavaScript click as a fallback
    try {
      await button.evaluate(btn => btn.click());
      console.log('✅ Successfully clicked button via JavaScript');
      await sleep(5000);
      return true;
    } catch (jsClickErr) {
      console.log(`⚠️ JavaScript click also failed: ${jsClickErr.message}`);
      return false;
    }
  }
};
