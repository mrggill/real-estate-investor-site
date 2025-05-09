// scripts/AxiosDallasScraper.mjs

import 'dotenv/config';
import { chromium } from 'playwright';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

// Setup Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const openaiKey = process.env.OPENAI_API_KEY;

// Sleep helper
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Random sleep to appear more human-like
const randomSleep = async (min, max) => {
  const sleepTime = Math.floor(Math.random() * (max - min + 1)) + min;
  await sleep(sleepTime);
};

// Function to compress HTML for storage
const compressHtml = async (html, filename) => {
  const zlib = await import('zlib');
  const util = await import('util');
  const compress = util.promisify(zlib.gzip);
  
  const compressed = await compress(Buffer.from(html));
  await fs.writeFile(`./debug/${filename}.html.gz`, compressed);
  console.log(`📋 Saved compressed HTML snapshot to ./debug/${filename}.html.gz`);
};

// Updated saveHtmlForDebugging to use compression
const saveHtmlForDebugging = async (page, filename) => {
  try {
    const html = await page.content();
    
    // Create debug directory if it doesn't exist
    await fs.mkdir('./debug', { recursive: true });
    
    // Save the HTML file
    await fs.writeFile(`./debug/${filename}.html`, html);
    console.log(`📋 Saved HTML snapshot to ./debug/${filename}.html`);
    
    // Also take a screenshot
    await page.screenshot({ path: `./debug/${filename}.png`, fullPage: false });
    console.log(`📸 Saved screenshot to ./debug/${filename}.png`);
  } catch (err) {
    console.error(`❌ Error saving debug files: ${err.message}`);
  }
};

// Helper to check if button is in viewport
const isInViewport = async (elementHandle) => {
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

// Backoff function for rate limiting
const backoffStrategy = (() => {
  let attempts = 0;
  const maxAttempts = 5;
  
  return {
    shouldRetry: () => attempts < maxAttempts,
    wait: async () => {
      attempts++;
      const waitTime = Math.pow(2, attempts) * 10000; // Exponential backoff: 20s, 40s, 80s...
      console.log(`⏱️ Rate limit detected. Backing off for ${waitTime/1000} seconds (attempt ${attempts}/${maxAttempts})...`);
      await sleep(waitTime);
    },
    reset: () => {
      attempts = 0;
    }
  };
})();

// Function to check if article is related to jobs and employment
function isJobRelated(title, content) {
  const jobKeywords = [
    // Employment and jobs
    'job', 'jobs', 'employment', 'unemployment', 'hiring', 'layoff', 'layoffs',
    'workforce', 'worker', 'workers', 'career', 'careers', 'labor market',
    'recruit', 'recruitment', 'employer', 'employers', 'employee', 'employees',
    'wage', 'wages', 'salary', 'salaries', 'job market', 'jobless', 'hire',
    'hiring', 'work force', 'remote work', 'office', 'workplace', 'job growth',
    'position', 'staff', 'talent', 'personnel', 'human resources', 'HR',
    
    // Manufacturing and production
    'production', 'manufacturing', 'factory', 'factories', 'plant', 'assembly',
    'industrial', 'fabrication', 'warehouse', 'supply chain', 'automation',
    'manufacturing jobs', 'production line', 'processing', 'assembly line',
    
    // Business relocation and facilities
    'relocating', 'relocation', 'headquarters', 'HQ', 'campus', 'office space',
    'moving operations', 'expanding operations', 'facility', 'facilities',
    'new plant', 'new location', 'opening location', 'corporate relocation',
    'moving to', 'moving from', 'expansion to', 'expansion into',
    
    // Distribution and logistics
    'distribution center', 'fulfillment center', 'logistics', 'shipping center',
    'warehouse jobs', 'distribution hub', 'supply hub', 'operations center',
    'regional center', 'storage facility', 'distribution network',
    
    // Real estate business terms
    'commercial property', 'corporate real estate',
    'business park', 'industrial park', 'commercial development',
    'business district'
  ];
  
  const titleLower = title.toLowerCase();
  const contentLower = content.toLowerCase();
  
  // Check if any keywords are in the title (higher weight)
  const titleMatch = jobKeywords.some(keyword => titleLower.includes(keyword));
  if (titleMatch) return true;
  
  // Check if multiple keywords are in the content (for better accuracy)
  let keywordCount = 0;
  for (const keyword of jobKeywords) {
    if (contentLower.includes(keyword)) {
      keywordCount++;
      // If we find 3 or more different job-related keywords, consider it relevant
      if (keywordCount >= 3) return true;
    }
  }
  
  return false;
}

// Function to create a content fingerprint for duplicate detection
function getContentFingerprint(content) {
  // Extract first 200 characters of cleaned content as a fingerprint
  return content
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .trim()
    .slice(0, 200)         // Use beginning of article
    .toLowerCase();        // Case-insensitive comparison
}

// Function to check if date is recent enough (>=Jan 1, 2023)
function isRecentEnough(dateStr) {
  const articleDate = new Date(dateStr);
  const minDate = new Date('2023-01-01');
  return articleDate >= minDate;
}

// Summarization helper
const summarizeWithFallback = async (content) => {
  if (!openaiKey) return null;

  try {
    const res = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: `Summarize this news article in one sentence: ${content}` },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.data.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error('❌ OpenAI summarization error:', err.message);
    return null;
  }
};

// Get already scraped articles (urls and content fingerprints)
const getExistingArticles = async () => {
  const { data, error } = await supabase
    .from('articles')
    .select('url, content');

  if (error) {
    console.error('❌ Error fetching existing articles:', error.message);
    return { urls: new Set(), fingerprints: new Set() };
  }

  const urls = new Set(data.map(row => row.url));
  const fingerprints = new Set(data.map(row => getContentFingerprint(row.content || '')));
  
  console.log(`📚 Found ${urls.size} existing articles in database`);
  return { urls, fingerprints };
};

const scrapeAxiosDallas = async () => {
  console.log('🌐 Starting Axios Dallas News scraper...');
  
  // Create debug directory if it doesn't exist
  try {
    await fs.mkdir('./debug', { recursive: true });
  } catch (err) {
    // Ignore if directory already exists
  }

  let browser;
  try {
    console.log('🚀 Launching browser...');
    
    // Launch browser with a realistic user agent
    browser = await chromium.launch({
      headless: false // Set to true for production
    });
    
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      deviceScaleFactor: 1,
    });
    
    console.log('✅ Browser launched successfully');
    
    const page = await context.newPage();
    
    // Set extra HTTP headers to appear more like a real browser
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    });

    // Go to Axios Dallas NEWS page specifically (not the home page)
    console.log('🌐 Visiting Axios Dallas News page...');
    try {
      await page.goto('https://www.axios.com/local/dallas/news', { 
        waitUntil: 'networkidle', // Wait for network to be idle to ensure content loads
        timeout: 60000 // Longer timeout to ensure page loads completely
      });
      
      // Check if page loaded successfully
      const title = await page.title();
      console.log(`📑 Page title: "${title}"`);
      
      if (!title || title.includes('Error') || title.includes('Access Denied')) {
        throw new Error('Page did not load correctly');
      }
      
      console.log('✅ News page loaded successfully');
      await saveHtmlForDebugging(page, 'news-page-initial-load');
      
    } catch (err) {
      console.error(`❌ Error navigating to Axios Dallas News: ${err.message}`);
      await saveHtmlForDebugging(page, 'navigation-error');
      await browser.close();
      return;
    }

    // Handle cookie consent banner if it appears
    try {
      console.log('🍪 Checking for cookie consent banner...');
      const acceptButton = await page.$('button:has-text("Accept"), button:has-text("Accept all"), button:has-text("I agree")');
      if (acceptButton) {
        await acceptButton.click();
        console.log('🍪 Accepted cookies');
        await sleep(2000);
      }
    } catch (err) {
      console.log('ℹ️ No cookie banner found or unable to click');
    }

    console.log('⌛ Waiting for content to initialize...');
    try {
      await page.waitForSelector('main', { timeout: 30000 });
      await sleep(3000); // Extra wait to ensure dynamic content loads
    } catch (err) {
      console.error('❌ Timeout waiting for main content:', err.message);
      await saveHtmlForDebugging(page, 'timeout-main');
      await browser.close();
      return;
    }
    
    // Log article count before starting to help us track progress
    console.log('📊 Checking initial number of article links...');
    const initialArticleCount = await page.$$eval('a[href*="/2025/"], a[href*="/2024/"]', links => links.length);
    console.log(`🔢 Initial article count: ${initialArticleCount}`);

    console.log('📜 Starting sequential load more process...');
    
    // Track if we've made progress
    let previousArticleCount = initialArticleCount;
    let noProgressCount = 0;
    const maxNoProgressAttempts = 5;
    let loadMoreCount = 0;
    const buttonAttempts = 15; // Maximum number of "load more" attempts
    
    // More intensive button finding and clicking approach
    for (let i = 0; i < buttonAttempts; i++) {
      console.log(`🔄 Load more attempt ${i+1}/${buttonAttempts}...`);
      
      // First, scroll down to bottom to ensure any lazy-loaded buttons appear
      console.log('⬇️ Scrolling to bottom of page...');
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await sleep(3000);
      
      // Save the state at this point
      await saveHtmlForDebugging(page, `before-load-more-${i}`);

      // Look for various types of "load more" buttons with multiple possible selectors
      const buttonSelectors = [
        // Text-based buttons
        'button:has-text("Show more stories")', 
        'button:has-text("Load more")',
        'button:has-text("More stories")',
        'button:has-text("Show more")',
        'button:has-text("Next")',
        'button:has-text("View more")',
        'a:has-text("Show more stories")',
        'a:has-text("Load more")',
        'a:has-text("Next")',
        'a:has-text("More")',
        'div:has-text("Load more")',
        
        // Class-based buttons
        'button.load-more',
        'button[data-cy*="loadMore"]',
        'button.pagination-next',
        'a.pagination-next',
        'button.next-page',
        'a.next-page',
        
        // Icon/symbol buttons
        'button svg[class*="arrow"]',
        'button i[class*="arrow"]',
        'button i[class*="fa-arrow"]',
        'button span[class*="icon"]',
        'button[aria-label*="next"]',
        'button[aria-label*="more"]',
        'button[aria-label*="load"]',
        
        // Role-based buttons
        'div[role="button"]:has-text("Show more")',
        'div[role="button"]:has-text("Load")',
        'div[role="button"]:has-text("Next")',
        'div[role="button"] svg',
        '[role="button"]:has(svg)',
        
        // Generic pagination elements
        '.pagination button:last-child',
        '.pagination a:last-child',
        '.load-more',
        '.show-more',
        '.pagination-next'
      ];
      
      let buttonFound = false;
      
      // Try each selector
      for (const buttonSelector of buttonSelectors) {
        const buttons = await page.$$(buttonSelector);
        
        for (const button of buttons) {
          // Check if button is visible
          const isVisible = await button.isVisible();
          if (!isVisible) {
            continue;
          }
          
          // Check if button is in viewport
          const inViewport = await isInViewport(button);
          if (!inViewport) {
            console.log(`📌 Found button outside viewport, scrolling to it...`);
            await button.scrollIntoViewIfNeeded();
            await sleep(1000);
          }
          
          console.log(`🔘 Found load more button with selector: ${buttonSelector}`);
          
          // Take a screenshot of the button for debugging
          try {
            const buttonBox = await button.boundingBox();
            if (buttonBox) {
              await page.screenshot({ 
                path: `./debug/load-more-button-${i}.png`,
                clip: {
                  x: Math.max(0, buttonBox.x - 20),
                  y: Math.max(0, buttonBox.y - 20),
                  width: Math.min(page.viewportSize().width, buttonBox.width + 40),
                  height: Math.min(page.viewportSize().height, buttonBox.height + 40)
                }
              });
            }
          } catch (screenshotErr) {
            console.log(`Note: Couldn't take button screenshot: ${screenshotErr.message}`);
          }
          
          // Click the button and wait for new content to load
          console.log('👆 Clicking "load more" button...');
          try {
            await button.click();
            console.log('⏳ Waiting for new stories to load...');
            await sleep(5000); // Wait for new content to load
            
            // Save the state after clicking for debugging
            await saveHtmlForDebugging(page, `after-load-more-${i}`);
            console.log('✅ Successfully clicked button');
            buttonFound = true;
            loadMoreCount++;
            break;
          } catch (clickErr) {
            console.log(`⚠️ Error clicking button: ${clickErr.message}`);
            
            // Try JavaScript click as a fallback
            try {
              await button.evaluate(btn => btn.click());
              console.log('✅ Successfully clicked button via JavaScript');
              await sleep(5000);
              buttonFound = true;
              loadMoreCount++;
              break;
            } catch (jsClickErr) {
              console.log(`⚠️ JavaScript click also failed: ${jsClickErr.message}`);
            }
          }
        }
        
        if (buttonFound) break;
      }
      
      // Check if we've loaded more articles
      const currentArticleCount = await page.$$eval('a[href*="/2025/"], a[href*="/2024/"]', links => links.length);
      console.log(`🔢 Current article count: ${currentArticleCount} (previously: ${previousArticleCount})`);
      
      if (currentArticleCount > previousArticleCount) {
        console.log(`✅ Progress! Found ${currentArticleCount - previousArticleCount} new articles`);
        previousArticleCount = currentArticleCount;
        noProgressCount = 0;
      } else {
        noProgressCount++;
        console.log(`ℹ️ No new articles found (attempt ${noProgressCount}/${maxNoProgressAttempts})`);
        
        if (noProgressCount >= maxNoProgressAttempts) {
          console.log('⚠️ Reached maximum attempts without progress, stopping load more process');
          break;
        }
      }
      
      // If no button was found, but we're making progress, try scrolling more
      if (!buttonFound && noProgressCount < maxNoProgressAttempts) {
        console.log('🔄 No button found, scrolling more to trigger lazy loading...');
        
        // Scroll in smaller increments from bottom to middle of page
        for (let scroll = 0; scroll < 5; scroll++) {
          await page.evaluate((scroll) => {
            const totalHeight = document.body.scrollHeight;
            const scrollPosition = totalHeight - (scroll * (totalHeight / 10));
            window.scrollTo(0, scrollPosition);
          }, scroll);
          await sleep(1000);
        }
      }
      
      // Wait between attempts
      if (i < buttonAttempts - 1) {
        await sleep(3000);
      }
    }
    
    console.log(`📊 Load more process complete. Clicked ${loadMoreCount} load more buttons.`);
    
    console.log('📋 Saving final page state for analysis...');
    await saveHtmlForDebugging(page, 'final-page-state');

    console.log('🔎 Collecting articles with multiple selectors...');
    
    // Try multiple possible selectors to find articles
    // Focus on 2023 and newer with these selectors
    const selectors = [
      // Specific date-based article links (only 2023 and later)
      'a[href*="/2025/"]:not([href*="membership"])',
      'a[href*="/2024/"]:not([href*="membership"])',
      'a[href*="/2023/"]:not([href*="membership"])',
      'article a[href*="/local/dallas/202"]', 
      'div[data-cy*="gridContent"] a[href*="/local/dallas/202"]',
      // Article cards or containers (only 2023 and later)
      'div[data-cy*="collection"] a[href*="/202"]',
      'div[data-cy="taxContent"] a[href*="/local/dallas/202"]',
      // Headers or titles that are links (only 2023 and later)
      'h2 a[href*="/local/dallas/202"]',
      'h3 a[href*="/local/dallas/202"]',
      // More generic article selectors (only 2023 and later)
      'main a[href*="/202"]',
      'div[data-cy] a[href*="/202"]',
      'a[href*="/local/dallas/202"]'
    ];
    
    let articles = [];
    
    for (const selector of selectors) {
      console.log(`🔍 Trying selector: ${selector}`);
      try {
        const found = await page.$$eval(selector, (links) => {
          return links
            .map((link) => {
              // Extract title, trying different approaches
              let title = link.textContent?.trim();
              // If it has inner elements, try to get specific title text
              if (link.querySelector('span.font-sans, h2, h3, div.headline')) {
                title = link.querySelector('span.font-sans, h2, h3, div.headline').textContent?.trim();
              }
              
              const url = link.href;
              
              // Validate URL and title
              if (!title || !url) return null;
              if (!url.includes('axios.com') || url.includes('membership')) return null;
              
              // Get date from URL if possible, otherwise use current date
              let date = new Date().toISOString().split('T')[0];
              const urlMatch = url.match(/\/(\d{4})\/(\d{1,2})\/(\d{1,2})\//);
              if (urlMatch) {
                const [_, year, month, day] = urlMatch;
                date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              }
              
              return { title, url, date };
            })
            .filter(Boolean);
        });
        
        console.log(`📊 Found ${found.length} items with selector: ${selector}`);
        
        // Deduplicate based on URL
        const urlSet = new Set(articles.map(a => a.url));
        for (const item of found) {
          if (!urlSet.has(item.url)) {
            articles.push(item);
            urlSet.add(item.url);
          }
        }
      } catch (err) {
        console.log(`⚠️ Error with selector "${selector}": ${err.message}`);
      }
    }
    
    // Deduplicate final list again and filter out navigation links and too old articles
    const uniqueUrls = new Set();
    articles = articles.filter(a => {
      if (uniqueUrls.has(a.url)) return false;
      
      // Filter out navigation links, category pages, author pages
      if (a.url.includes('/authors/') || 
          a.url.endsWith('/dallas') || 
          a.url.endsWith('/dallas/news') ||
          a.url.endsWith('/business') ||
          a.url.endsWith('/sports')) {
        return false;
      }
      
      // Skip articles published before Jan 1, 2023
      if (a.date) {
        const articleDate = new Date(a.date);
        const minDate = new Date('2023-01-01');
        if (articleDate < minDate) {
          console.log(`⏭️ Skipping older article (${a.date}): ${a.title}`);
          return false;
        }
      }
      
      uniqueUrls.add(a.url);
      return true;
    });

    console.log(`📰 Found ${articles.length} total unique article links from 2023 onwards.`);
    
    // Log all articles for debugging
    console.log('📋 Found articles:');
    articles.forEach((a, i) => {
      console.log(`${i+1}. "${a.title}" - ${a.url} (${a.date})`);
    });

    if (articles.length === 0) {
      console.warn('⚠️ No articles found after filtering, exiting.');
      await browser.close();
      return;
    }

    // For debugging: save the list of found articles
    try {
      await fs.writeFile('./debug/found-articles.json', JSON.stringify(articles, null, 2));
      console.log('📋 Saved article list to ./debug/found-articles.json');
    } catch (err) {
      console.error(`❌ Error saving article list: ${err.message}`);
    }

    // Get existing articles
    const { urls: existingUrls, fingerprints: existingFingerprints } = await getExistingArticles();
    console.log(`📊 Found ${existingUrls.size} already scraped URLs in database`);

    // Process articles
    let newArticlesCount = 0;
    let jobRelatedCount = 0;
    let duplicateContentCount = 0;
    let processedCount = 0;
    
    for (const a of articles) {
      processedCount++;
      console.log(`\n🔄 Processing article ${processedCount}/${articles.length}: ${a.title}`);
      
      // Skip if already scraped by URL
      if (existingUrls.has(a.url)) {
        console.log(`⏭️ Skipping already scraped article: ${a.title}`);
        continue;
      }

      console.log(`➡️ Fetching article: ${a.url}`);
      
      const articlePage = await context.newPage();
      try {
        // Navigate to article with better error handling
        try {
          await articlePage.goto(a.url, { 
            waitUntil: 'networkidle', // Wait for all content to load
            timeout: 40000 // Longer timeout for article pages
          });
        } catch (err) {
          console.error(`❌ Failed to load article page: ${err.message}`);
          await saveHtmlForDebugging(articlePage, `failed-article-${a.title.slice(0, 20).replace(/[^a-z0-9]/gi, '-').toLowerCase()}`);
          await articlePage.close();
          continue;
        }
        
        // Handle cookie consent on article page too
        try {
          const acceptButton = await articlePage.$('button:has-text("Accept"), button:has-text("Accept all"), button:has-text("I agree")');
          if (acceptButton) {
            await acceptButton.click();
            console.log('🍪 Accepted cookies on article page');
            await sleep(2000);
          }
        } catch (err) {
          // Ignore errors with cookie handling
        }
        
        // Extra wait for dynamic content to load
        await sleep(3000); 
        
        // Save the article page for analysis
        await saveHtmlForDebugging(articlePage, `article-page-${a.title.slice(0, 20).replace(/[^a-z0-9]/gi, '-').toLowerCase()}`);
        
        // Wait for article content to load
        try {
          await articlePage.waitForSelector('article, .article-body, main', { timeout: 20000 });
        } catch (err) {
          console.log(`⚠️ Timeout waiting for article content: ${err.message}`);
        }
        
        // Try multiple selectors for article content
        const contentSelectors = [
          'article[data-cy="articleContent"]', 
          'div[data-cy="articleBody"]',
          'div.article-body',
          'div[data-cy="articleContent"]',
          'main article', 
          'article',
          'div[role="main"]',
          'main div[data-cy]'
        ];
        
        let content = null;
        let publishDate = a.date; // Default to the date we already have
        
        // Try to extract the exact publication date from the article
        try {
          const dateTime = await articlePage.$eval('time', el => el.getAttribute('datetime'));
          if (dateTime) {
            // Parse the datetime attribute to get just the date part
            const parsedDate = new Date(dateTime);
            publishDate = parsedDate.toISOString().split('T')[0];
            console.log(`📅 Found exact publication date: ${publishDate}`);
            
            // Verify date is recent enough
            if (!isRecentEnough(publishDate)) {
              console.log(`📅 Skipping article with date before 2023: ${publishDate}`);
              await articlePage.close();
              continue;
            }
          }
        } catch (err) {
          console.log(`ℹ️ Could not extract publication date, using: ${publishDate}`);
        }
        
        // Try different selectors to find the content
        for (const selector of contentSelectors) {
          try {
            // First try to get text directly
            content = await articlePage.$eval(selector, (el) => el.innerText.trim());
            
            if (content && content.length > 100) {
              console.log(`✅ Found content using selector: ${selector}`);
              break;
            }
            
            // If that fails, try to get text from paragraphs
            const paragraphs = await articlePage.$$eval(`${selector} p`, (paragraphs) => {
              return paragraphs.map(p => p.innerText.trim()).filter(text => text.length > 0).join('\n\n');
            });
            
            if (paragraphs && paragraphs.length > 100) {
              content = paragraphs;
              console.log(`✅ Found content using paragraph selector: ${selector} p`);
              break;
            }
          } catch (err) {
            // Try next selector
          }
        }
        
        // If still no content, try extracting paragraphs directly
        if (!content || content.length < 100) {
          try {
            const allParagraphs = await articlePage.$$eval('article p, .article-body p, main p', (paragraphs) => {
              return paragraphs
                .map(p => p.innerText.trim())
                .filter(text => text.length > 20) // Only include substantial paragraphs
                .join('\n\n');
            });
            
            if (allParagraphs && allParagraphs.length > 100) {
              content = allParagraphs;
              console.log('✅ Found content using direct paragraph selection');
            }
          } catch (err) {
            console.log(`⚠️ Error extracting paragraphs: ${err.message}`);
          }
        }
        
        // Wait before closing to ensure any pending operations complete
        await sleep(1000);
        await article
        // Wait before closing to ensure any pending operations complete
        await sleep(1000);
        await articlePage.close();

        // Skip if no content found
        if (!content || content.length < 100) {
          console.warn(`⚠️ Skipping insert (no content found): ${a.title}`);
          continue;
        }
        
        // Check for duplicate content using fingerprinting
        const contentFingerprint = getContentFingerprint(content);
        if (existingFingerprints.has(contentFingerprint)) {
          console.log(`🔄 Skipping duplicate content article: ${a.title}`);
          duplicateContentCount++;
          continue;
        }
        
        // Check if article is job-related
        if (!isJobRelated(a.title, content)) {
          console.log(`🔍 Skipping non-job-related article: ${a.title}`);
          continue;
        }
        
        // Article is job-related, count it
        jobRelatedCount++;
        console.log(`💼 Job-related article found: ${a.title}`);

        // Generate summary
        let summary = await summarizeWithFallback(content);
        if (!summary) {
          const firstSentence = content.split('. ')[0]?.trim();
          summary = firstSentence ? `${firstSentence} - click here to read more` : null;
        }

        if (!summary) {
          console.warn(`⚠️ Skipping insert (no summary): ${a.title}`);
          continue;
        }

        const article = {
          id: uuidv4(),
          title: a.title,
          url: a.url,
          date: publishDate, // Use the extracted publication date
          city: 'Dallas',
          state: 'TX',
          content,
          summary,
          source_url: a.url,
        };

        const { error } = await supabase.from('articles').upsert(article, { onConflict: ['url'] });

        if (error) {
          console.error('❌ Insert error:', JSON.stringify(error, null, 2), '\nArticle:', article);
        } else {
          console.log(`✅ Inserted/Updated: ${article.title}`);
          newArticlesCount++;
        }
      } catch (err) {
        console.error(`❌ Error processing article ${a.url}: ${err.message}`);
        await saveHtmlForDebugging(articlePage, 'article-error');
        try {
          await articlePage.close();
        } catch (closeErr) {
          // Ignore errors when closing page
        }
      }
      
      // Random delay between article processing to avoid rate limits
      await randomSleep(3000, 6000);
    }

    console.log(`\n📊 Scraping Summary:`);
    console.log(`📰 Total articles found: ${articles.length}`);
    console.log(`⏭️ Already scraped: ${articles.length - processedCount + newArticlesCount}`);
    console.log(`🔄 Duplicate content: ${duplicateContentCount}`);
    console.log(`💼 Job-related articles: ${jobRelatedCount}`);
    console.log(`✅ New articles added: ${newArticlesCount}`);
    
    await browser.close();
    console.log('🎉 Finished scraping Axios Dallas News.');
    
  } catch (err) {
    console.error(`❌ Fatal error: ${err.message}`);
    if (browser) await browser.close();
  }
};

scrapeAxiosDallas().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});