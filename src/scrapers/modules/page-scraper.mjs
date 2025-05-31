// src/scrapers/modules/page-scraper.mjs
import { launchBrowser, createBrowserContext, navigateToPage, tryArchiveUrls, handleCookieConsent, isInViewport, clickLoadMoreButton } from '../utils/browser-utils.mjs';
import { saveHtmlForDebugging } from '../utils/file-utils.mjs';
import { sleep, randomSleep } from '../utils/time-utils.mjs';
import logger from '../utils/logger.mjs';
import reportGenerator from './report-generator.mjs';
import articleProcessor from './article-processor.mjs';

class PageScraper {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  /**
   * Initialize the scraper
   * @param {boolean} headless - Whether to run in headless mode
   * @returns {Promise<boolean>} - True if initialization was successful
   */
  async init(headless = true) {
    try {
      // Launch the browser
      this.browser = await launchBrowser(headless);
      
      // Create a new context and page
      const { context, page } = await createBrowserContext(this.browser);
      this.context = context;
      this.page = page;
      
      return true;
    } catch (err) {
      logger.error('Failed to initialize page scraper', err);
      return false;
    }
  }

  /**
   * Clean up resources
   * @returns {Promise<void>}
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
    }
  }

  /**
   * Scrape a single site
   * @param {Object} site - Site configuration
   * @param {Date} lastScrapeDate - Only process articles newer than this date
   * @returns {Promise<Object>} - Scrape results
   */
  async scrapeSite(site, lastScrapeDate) {
    logger.section(`Starting scrape for ${site.name}`);
    logger.info(`Only processing articles newer than ${lastScrapeDate.toISOString().slice(0, 10)}`);
    
    // Default result structure
    const result = {
      success: false,
      totalArticles: 0,
      newArticles: 0,
      errorMessage: null,
      articles: []
    };
    
    try {
      // Initialize if not already initialized
      if (!this.browser) {
        const headless = process.env.HEADLESS !== 'false';
        await this.init(headless);
      }
      
      // Try to navigate to the site
      let navigationSuccess = false;
      
      // First try to find an archive page
      const archiveFound = await tryArchiveUrls(this.page, site.url);
      
      // If no archive found, go to the main URL
      if (!archiveFound) {
        navigationSuccess = await navigateToPage(this.page, site.url, site.name);
      } else {
        navigationSuccess = true;
      }
      
      if (!navigationSuccess) {
        throw new Error('Failed to navigate to site');
      }
      
      // Handle cookie consent banner if it appears
      await handleCookieConsent(this.page);
      
      // Wait for content to initialize
      logger.info('Waiting for content to initialize...');
      try {
        if (site.scrapeOptions?.waitForSelector) {
          await this.page.waitForSelector(site.scrapeOptions.waitForSelector, { timeout: 30000 });
        } else {
          await this.page.waitForSelector('main, article, .content, body', { timeout: 30000 });
        }
        await sleep(3000); // Extra wait to ensure dynamic content loads
      } catch (err) {
        logger.warning('Timeout waiting for main content, continuing anyway');
      }
      
      // Log article count before starting
      logger.info('Checking initial number of article links...');
      let initialArticleCount = await this.countArticles(site, this.page);
      logger.stats(`Initial article count: ${initialArticleCount}`);
      
      // Start the load more process
      await this.loadMoreContent(site, this.page);
      
      // Collect articles with multiple selectors
      const articles = await this.collectArticles(site, this.page);
      result.totalArticles = articles.length;
      
      // Process the articles to check relevance
      const processedArticles = await articleProcessor.processArticlesBatch(
        this.browser,
        this.page,
        articles,
        site.name,
        site.url,
        site.scrapeOptions?.maxArticles
      );
      
      result.articles = processedArticles;
      result.newArticles = processedArticles.length;
      result.success = true;
      
      // Update scrape history
      await reportGenerator.updateScrapeHistory(site.url, true, processedArticles.length);
      
      logger.success(`Scrape complete for ${site.name}`);
      logger.stats(`Found ${articles.length} unique articles`);
      logger.stats(`${processedArticles.length} relevant articles after filtering`);
      
      return result;
    } catch (error) {
      logger.error(`Unhandled error in scrape process: ${error.message}`);
      
      // Update failed scrape history
      await reportGenerator.updateScrapeHistory(site.url, false, 0);
      
      result.errorMessage = error.message;
      return result;
    }
  }

  /**
   * Count articles on the current page
   * @param {Object} site - Site configuration
   * @param {Object} page - Page object
   * @returns {Promise<number>} - Article count
   */
  async countArticles(site, page) {
    try {
      const linkSelectors = site.scrapeOptions?.selectors?.articleLinks || [
        'a[href*="/2025/"]', 'a[href*="/2024/"]', 'a[href*="/2023/"]',
        'a[href*="/2022/"]', 'a[href*="/2021/"]', 'a[href*="/2020/"]'
      ];
      
      let count = 0;
      for (const selector of linkSelectors) {
        const links = await page.$$(selector);
        count += links.length;
      }
      
      return count;
    } catch (err) {
      logger.error(`Error counting articles: ${err.message}`);
      return 0;
    }
  }

  /**
   * Load more content by scrolling and clicking buttons
   * @param {Object} site - Site configuration
   * @param {Object} page - Page object
   * @returns {Promise<void>}
   */
  async loadMoreContent(site, page) {
    // Flag to track if we've reached 2020 content
    let reached2020Content = false;
    logger.info('Starting sequential load more process...');
    
    // Track if we've made progress
    let previousArticleCount = await this.countArticles(site, page);
    let noProgressCount = 0;
    const maxNoProgressAttempts = 5;
    let loadMoreCount = 0;
    const buttonAttempts = site.scrapeOptions?.loadMoreAttempts || 100;
    
    // Load more content
    for (let i = 0; i < buttonAttempts; i++) {
      logger.info(`Load more attempt ${i+1}/${buttonAttempts}...`);
      
      // First, scroll down to bottom to ensure any lazy-loaded buttons appear
      logger.info('Scrolling to bottom of page...');
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await sleep(3000);
      
      // Check if we've reached content from 2020
      let has2020Articles = false;
      try {
        has2020Articles = await page.$$eval('a[href*="/2020/"]', links => links.length > 0);
      } catch (err) {
        logger.warning('Error checking for 2020 articles');
      }
      
      if (has2020Articles && !reached2020Content) {
        logger.info('Found articles from 2020! Will continue a bit further to get more 2020 content.');
        reached2020Content = true;
      }
      
      // If we've been finding 2020 content for several scrolls, check date range
      if (reached2020Content) {
        try {
          const oldest2020ArticleDate = await page.$$eval('a[href*="/2020/"]', links => {
            const dates = links.map(link => {
              const match = link.href.match(/\/2020\/(\d{1,2})\/(\d{1,2})\//);
              if (match) {
                return `2020-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
              }
              return null;
            }).filter(Boolean);
            
            if (dates.length === 0) return null;
            
            // Find the oldest date
            return dates.sort()[0];
          });
          
          if (oldest2020ArticleDate) {
            logger.info(`Oldest 2020 article found: ${oldest2020ArticleDate}`);
            
            // If we've reached January or close to it, we can stop
            if (oldest2020ArticleDate <= '2020-02-01') {
              logger.info('Reached early 2020 content, stopping load more process');
              break;
            }
          }
        } catch (err) {
          logger.warning(`Error analyzing 2020 article dates: ${err.message}`);
        }
      }
      
      // Save the state at this point only every 5 iterations to save disk space
      if (i % 5 === 0) {
        await saveHtmlForDebugging(page, `${site.name.replace(/\s+/g, '_')}-before-load-more-${i}`);
      }
      
      // Look for "load more" buttons with multiple possible selectors
      const buttonSelectors = [
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
        'button.load-more',
        'button[data-cy*="loadMore"]',
        'button.pagination-next',
        'a.pagination-next',
        'button.next-page',
        'a.next-page',
        'button svg[class*="arrow"]',
        'button i[class*="arrow"]',
        'button i[class*="fa-arrow"]',
        'button span[class*="icon"]',
        'button[aria-label*="next"]',
        'button[aria-label*="more"]',
        'button[aria-label*="load"]',
        'div[role="button"]:has-text("Show more")',
        'div[role="button"]:has-text("Load")',
        'div[role="button"]:has-text("Next")',
        'div[role="button"] svg',
        '[role="button"]:has(svg)',
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
            logger.info(`Found button outside viewport, scrolling to it...`);
            await button.scrollIntoViewIfNeeded();
            await sleep(1000);
          }
          
          logger.info(`Found load more button with selector: ${buttonSelector}`);
          
          // Take a screenshot of the button for debugging
          try {
            const buttonBox = await button.boundingBox();
            if (buttonBox) {
              await page.screenshot({ 
                path: `./debug/${site.name.replace(/\s+/g, '_')}-load-more-button-${i}.png`,
                clip: {
                  x: Math.max(0, buttonBox.x - 20),
                  y: Math.max(0, buttonBox.y - 20),
                  width: Math.min(page.viewportSize().width, buttonBox.width + 40),
                  height: Math.min(page.viewportSize().height, buttonBox.height + 40)
                }
              });
            }
          } catch (screenshotErr) {
            logger.warning(`Couldn't take button screenshot: ${screenshotErr.message}`);
          }
          
          // Click the button and wait for new content to load
          logger.info('Clicking "load more" button...');
          buttonFound = await clickLoadMoreButton(button);
          
          if (buttonFound) {
            loadMoreCount++;
            break;
          }
        }
        
        if (buttonFound) break;
      }
      
      // Check if we've loaded more articles
      const currentArticleCount = await this.countArticles(site, page);
      logger.stats(`Current article count: ${currentArticleCount} (previously: ${previousArticleCount})`);
      
      if (currentArticleCount > previousArticleCount) {
        logger.success(`Progress! Found ${currentArticleCount - previousArticleCount} new articles`);
        previousArticleCount = currentArticleCount;
        noProgressCount = 0;
      } else {
        noProgressCount++;
        logger.warning(`No new articles found (attempt ${noProgressCount}/${maxNoProgressAttempts})`);
        
        if (noProgressCount >= maxNoProgressAttempts) {
          logger.warning('Reached maximum attempts without progress, stopping load more process');
          break;
        }
      }
      
      // If no button was found, but we're making progress, try scrolling more
      if (!buttonFound && noProgressCount < maxNoProgressAttempts) {
        logger.info('No button found, trying different scroll patterns...');
        
        // Try different scrolling patterns to trigger lazy loading
        await page.evaluate(() => {
          // Scroll to different positions
          const height = document.body.scrollHeight;
          
          // Scroll to 75% of the page
          window.scrollTo(0, height * 0.75);
          
          // Small scroll jitter to trigger any scroll listeners
          setTimeout(() => {
            window.scrollTo(0, height * 0.7);
            setTimeout(() => {
              window.scrollTo(0, height);
            }, 200);
          }, 200);
        });
        
        await sleep(3000);
      }
      
      // Wait between attempts
      if (i < buttonAttempts - 1) {
        await sleep(2000);
      }
    }
    
    logger.stats(`Load more process complete. Clicked ${loadMoreCount} load more buttons.`);
    
    logger.info('Saving final page state for analysis...');
    await saveHtmlForDebugging(page, `${site.name.replace(/\s+/g, '_')}-final-page-state`);
  }

  /**
   * Collect articles from the page using selectors
   * @param {Object} site - Site configuration
   * @param {Object} page - Page object
   * @returns {Promise<Array>} - Collected articles
   */
  async collectArticles(site, page) {
    logger.info('Collecting articles with multiple selectors...');
    
    // Try multiple possible selectors to find articles
    const selectors = site.scrapeOptions?.selectors?.articleLinks || [
      'a[href*="/2025/"]:not([href*="membership"])',
      'a[href*="/2024/"]:not([href*="membership"])',
      'a[href*="/2023/"]:not([href*="membership"])',
      'a[href*="/2022/"]:not([href*="membership"])',
      'a[href*="/2021/"]:not([href*="membership"])',
      'a[href*="/2020/"]:not([href*="membership"])',
      'article a[href*="/local/dallas/20"]',
      'div[data-cy*="gridContent"] a[href*="/local/dallas/20"]',
      'div[data-cy*="collection"] a[href*="/20"]',
      'div[data-cy="taxContent"] a[href*="/local/dallas/20"]',
      'h2 a[href*="/local/dallas/20"]',
      'h3 a[href*="/local/dallas/20"]',
      'main a[href*="/20"]',
      'div[data-cy] a[href*="/20"]',
      'a[href*="/local/dallas/20"]'
    ];
    
    let articles = [];
    
    for (const selector of selectors) {
      logger.info(`Trying selector: ${selector}`);
      try {
        const found = await page.$$eval(selector, (links) => {
          return links
            .map((link) => {
              // Extract title
              let title = link.textContent?.trim();
              // If it has inner elements, try to get specific title text
              if (link.querySelector('span.font-sans, h2, h3, div.headline')) {
                title = link.querySelector('span.font-sans, h2, h3, div.headline').textContent?.trim();
              }
              
              const url = link.href;
              
              // Validate URL and title
              if (!title || !url) return null;
              if (url.includes('membership')) return null;
              
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
        
        logger.stats(`Found ${found.length} items with selector: ${selector}`);
        
        // Deduplicate based on URL
        const urlSet = new Set(articles.map(a => a.url));
        for (const item of found) {
          if (!urlSet.has(item.url)) {
            articles.push(item);
            urlSet.add(item.url);
          }
        }
      } catch (err) {
        logger.warning(`Error with selector "${selector}": ${err.message}`);
      }
    }
    
    // Deduplicate final list
    const uniqueArticles = Array.from(
      new Map(articles.map(item => [item.url, item])).values()
    );
    
    logger.stats(`Found ${uniqueArticles.length} unique articles`);
    return uniqueArticles;
  }
}

// Create and export a singleton instance
const pageScraper = new PageScraper();
export default pageScraper;