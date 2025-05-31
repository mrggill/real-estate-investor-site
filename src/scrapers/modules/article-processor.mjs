// src/scrapers/modules/article-processor.mjs
import { v4 as uuidv4 } from 'uuid';
import { isRecentEnough } from '../utils/time-utils.mjs';
import logger from '../utils/logger.mjs';
import aiService from './ai-service.mjs';
import db from './db-manager.mjs';
import relevanceChecker from './relevance-checker.mjs';
import feedbackManager from './feedback-manager.mjs';

class ArticleProcessor {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the article processor
   * @returns {Promise<boolean>} - True if initialization successful
   */
  async init() {
    if (this.initialized) return true;
    
    try {
      // Initialize any dependencies
      await db.init();
      
      this.initialized = true;
      return true;
    } catch (err) {
      logger.error('Failed to initialize article processor', err);
      return false;
    }
  }

  /**
   * Filter a list of articles to remove navigation links and too old articles
   * @param {Array} articles - Articles to filter
   * @returns {Array} - Filtered articles
   */
  filterArticlesByUrl(articles) {
    return articles.filter(item => {
      // Filter out navigation links
      if (item.url.endsWith('/') || item.url.includes('/category/') || 
          item.url.includes('/tag/') || item.url.includes('/author/')) {
        return false;
      }
      
      // Make sure the date is valid and recent enough
      return isRecentEnough(item.date);
    });
  }

  /**
   * Process an article to extract content and check relevance
   * @param {Object} browser - Browser instance
   * @param {Object} page - Page object
   * @param {Object} article - Article basic info (url, title, date)
   * @param {Object} existingData - Existing URLs and fingerprints
   * @returns {Promise<Object|null>} - Processed article or null if irrelevant
   */
  async processArticle(browser, page, article, existingData) {
    try {
      logger.info(`Processing article: ${article.title}`);
      logger.info(`URL: ${article.url}`);
      
      // Skip if we already have this article
      if (existingData.urls.has(article.url)) {
        logger.info(`Skipping existing article: ${article.title}`);
        return null;
      }
      
      await page.goto(article.url, { 
        waitUntil: 'networkidle',
        timeout: 30000
      });
      
      // Wait for the article content to load
      await page.waitForSelector('article, .article, .post, main, .content', { 
        timeout: 10000 
      }).catch(() => logger.warning('Could not find an article selector, continuing anyway'));
      
      // Extract the content
      const content = await this.extractArticleContent(page);
      
      // Generate a fingerprint of the content to avoid duplicates
      const fingerprint = db.getContentFingerprint(content);
      if (existingData.fingerprints.has(fingerprint)) {
        logger.info(`Skipping article with duplicate content fingerprint`);
        return null;
      }
      
      // Extract additional metadata
      const metadata = await this.extractArticleMetadata(page);
      
      // Create a unique ID for the article
      const id = uuidv4();
      
      // Optionally, correct grammar in title with AI
      let finalTitle = article.title;
      if (process.env.ENABLE_GRAMMAR_CORRECTION === 'true') {
        try {
          logger.info('Correcting grammar in title...');
          finalTitle = await aiService.correctGrammar(article.title);
        } catch (err) {
          logger.warning(`Error correcting grammar: ${err.message}`);
        }
      }
      
      // Generate a summary with AI if enabled
      let aiSummary = null;
      if (process.env.ENABLE_AI_SUMMARY === 'true') {
        try {
          logger.info('Generating AI summary...');
          aiSummary = await aiService.generateSummary(content);
        } catch (err) {
          logger.warning(`Error generating summary: ${err.message}`);
        }
      }
      
      // Create the processed article object
      const processedArticle = {
        id,
        title: finalTitle,
        url: article.url,
        date: article.date,
        content,
        source: article.source,
        source_url: article.source_url,
        city: metadata.city || '',
        state: metadata.state || '',
        summary: aiSummary || metadata.summary || '',
        scraped_at: new Date().toISOString()
      };
      
      // Load feedback
      const feedback = await feedbackManager.loadFeedback();
      
      // Check if this article is explicitly included or excluded via feedback
      if (feedback.includedArticles.includes(article.url)) {
        processedArticle.relevance_reason = 'Explicitly included via feedback';
        return processedArticle;
      } else if (feedback.excludedArticles.includes(article.url)) {
        logger.info('Article explicitly excluded via feedback');
        return null;
      }
      
      // Check if article is relevant
      const relevance = await relevanceChecker.checkRelevance(
        processedArticle, 
        content,
        feedback
      );
      
      if (relevance.isRelevant) {
        logger.success(`Article is relevant: ${relevance.explanation}`);
        processedArticle.relevance_reason = relevance.explanation;
        return processedArticle;
      } else {
        logger.info(`Article is not relevant: ${relevance.explanation}`);
        return null;
      }
      
    } catch (err) {
      logger.error(`Error processing article: ${err.message}`);
      return null;
    }
  }

  /**
   * Extract content from an article page
   * @param {Object} page - Page object
   * @returns {Promise<string>} - Extracted content
   */
  async extractArticleContent(page) {
    return await page.evaluate(() => {
      // Try different content selectors
      const selectors = [
        'article', '.article', '.post-content', '.article-content',
        'main', '.content', '.story', '[itemprop="articleBody"]',
        '.story-body', '#content', '.entry-content'
      ];
      
      let content = '';
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          content = element.innerText || element.textContent || '';
          break;
        }
      }
      
      // If no content found with selectors, get body text as fallback
      if (!content) {
        content = document.body.innerText || document.body.textContent || '';
      }
      
      return content.trim();
    });
  }

  /**
   * Extract metadata from an article page
   * @param {Object} page - Page object
   * @returns {Promise<Object>} - Extracted metadata
   */
  async extractArticleMetadata(page) {
    return await page.evaluate(() => {
      // Look for location/city/state information
      const locationSelectors = [
        'span.location', '[data-cy="article-byline-location"]',
        '.article-byline span', '.article-location', '.location',
        '[class*="location"]', '[class*="byline-location"]'
      ];
      
      let location = '';
      for (const selector of locationSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          location = element.innerText || element.textContent || '';
          if (location) break;
        }
      }
      
      // Parse the location into city and state
      let city = '';
      let state = '';
      
      // Try to extract city and state from location string
      if (location) {
        // Common patterns like "Dallas, Texas" or "DALLAS, TX"
        const locationMatch = location.match(/([^,]+),\s*([^,]+)/);
        if (locationMatch) {
          city = locationMatch[1].trim();
          state = locationMatch[2].trim();
        } else {
          // Just use the whole string as city
          city = location.trim();
        }
      }
      
      // Look for a summary or description
      const summarySelectors = [
        'meta[name="description"]', 'meta[property="og:description"]',
        '.article-summary', '.summary', '.description', '.article-description',
        '.excerpt', '.article-excerpt', '.storyline', '.story-summary'
      ];
      
      let summary = '';
      for (const selector of summarySelectors) {
        const element = document.querySelector(selector);
        if (element) {
          if (element.tagName === 'META') {
            summary = element.getAttribute('content') || '';
          } else {
            summary = element.innerText || element.textContent || '';
          }
          if (summary) break;
        }
      }
      
      return { city, state, summary };
    });
  }

  /**
   * Process multiple articles in batch
   * @param {Object} browser - Browser instance
   * @param {Object} page - Page object
   * @param {Array} articles - Articles to process
   * @param {string} siteName - Name of the site
   * @param {string} siteUrl - URL of the site
   * @param {number} maxToProcess - Maximum number of articles to process
   * @returns {Promise<Array>} - Array of processed relevant articles
   */
  async processArticlesBatch(browser, page, articles, siteName, siteUrl, maxToProcess = 50) {
    await this.init();
    
    // First filter and clean up articles
    const uniqueArticles = this.filterArticlesByUrl(articles);
    logger.stats(`Found ${uniqueArticles.length} unique articles after filtering`);
    
    // Get existing article URLs and fingerprints for deduplication
    logger.info('Checking for existing articles...');
    const existingData = await db.getExistingArticles();
    
    // Process each article
    const processedArticles = [];
    const maxArticlesToProcess = maxToProcess || parseInt(process.env.MAX_ARTICLES_PER_SITE || '50', 10);
    let processedCount = 0;
    
    logger.info(`Processing up to ${maxArticlesToProcess} articles...`);
    
    for (const article of uniqueArticles) {
      // Stop if we've processed enough articles
      if (processedCount >= maxArticlesToProcess) {
        logger.info(`Reached maximum articles to process (${maxArticlesToProcess})`);
        break;
      }
      
      // Add source information to article
      article.source = siteName;
      article.source_url = siteUrl;
      
      // Process the article
      const processedArticle = await this.processArticle(browser, page, article, existingData);
      
      if (processedArticle) {
        processedArticles.push(processedArticle);
        processedCount++;
      }
    }
    
    logger.success(`Processed ${processedCount} articles, found ${processedArticles.length} relevant articles`);
    return processedArticles;
  }
}

// Create and export a singleton instance
const articleProcessor = new ArticleProcessor();
export default articleProcessor;
