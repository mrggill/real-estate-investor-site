// src/scrapers/index.mjs
import 'dotenv/config';
import logger from './utils/logger.mjs';
import { initDirectories } from './utils/file-utils.mjs';
import { loadSiteConfig, getSiteConfigs } from './modules/config-manager.mjs';
import db from './modules/db-manager.mjs';
import reportGenerator from './modules/report-generator.mjs';
import pageScraper from './modules/page-scraper.mjs';
import { saveArticlesToJson } from './utils/file-utils.mjs';
import feedbackManager from './modules/feedback-manager.mjs';

/**
 * Initialize the environment for scraping
 * @returns {Promise<boolean>} - True if initialization was successful
 */
const initializeEnvironment = async () => {
  try {
    // Initialize logger
    await logger.init();
    
    // Create necessary directories
    await initDirectories();
    
    // Initialize database connection
    const dbEnabled = await db.init();
    logger.info(`Database integration: ${dbEnabled ? 'Enabled' : 'Disabled'}`);
    
    // Check if OpenAI API is configured
    const openAiEnabled = !!process.env.OPENAI_API_KEY && process.env.ENABLE_AI !== 'false';
    logger.info(`OpenAI integration: ${openAiEnabled ? 'Enabled' : 'Disabled'}`);
    
    return true;
  } catch (err) {
    logger.error('Environment initialization error', err);
    return false;
  }
};

/**
 * Main function to run the scraper
 * @param {Object} options - Scraper options
 * @returns {Promise<Object>} - Scraper results
 */
async function runScraper(options = {}) {
  logger.section('Starting News Scraper');
  
  // Initialize environment first
  const initialized = await initializeEnvironment();
  if (!initialized) {
    logger.error('Failed to initialize environment, exiting');
    return {
      success: false,
      errorMessage: 'Environment initialization failed'
    };
  }
  
  // Load site configurations
  const siteConfigs = await getSiteConfigs();
  if (!siteConfigs || siteConfigs.length === 0) {
    logger.error('No site configurations found, exiting');
    return {
      success: false,
      errorMessage: 'No site configurations found'
    };
  }
  
  // Filter to only enabled sites unless specifically overridden
  const enabledSites = options.ignoreEnabledFlag
    ? siteConfigs
    : siteConfigs.filter(site => site.enabled !== false);
  
  logger.stats(`Found ${siteConfigs.length} total sites, ${enabledSites.length} enabled`);
  
  // If a specific site was requested by name, filter to just that one
  let sitesToScrape = enabledSites;
  if (options.siteName) {
    sitesToScrape = enabledSites.filter(
      site => site.name.toLowerCase() === options.siteName.toLowerCase()
    );
    
    if (sitesToScrape.length === 0) {
      logger.error(`Site "${options.siteName}" not found or not enabled`);
      logger.info('Available enabled sites:');
      enabledSites.forEach(site => logger.info(`- ${site.name}`));
      return {
        success: false,
        errorMessage: `Site "${options.siteName}" not found or not enabled`
      };
    }
  }
  
  // Configure options with defaults
  const config = {
    sites: sitesToScrape,
    maxSites: options.maxSites || Infinity,
    startIndex: options.startIndex || 0,
    lastScrapeDate: options.lastScrapeDate || new Date(process.env.MIN_ARTICLE_DATE || '2020-01-01'),
    enableAI: options.enableAI !== false && process.env.ENABLE_AI !== 'false',
    ...options
  };
  
  logger.info(`Configuration:`);
  logger.info(`Only processing articles newer than: ${config.lastScrapeDate.toISOString().slice(0, 10)}`);
  logger.info(`AI-based relevance detection: ${config.enableAI ? 'Enabled' : 'Disabled'}`);
  
  // Initialize feedback
  const userFeedback = await feedbackManager.loadFeedback();
  
  // Get list of sites to scrape
  const finalSitesToScrape = sitesToScrape.slice(config.startIndex, config.maxSites ? config.startIndex + config.maxSites : undefined);
  
  logger.info(`Will scrape ${finalSitesToScrape.length} sites`);
  
  // Track results
  const results = [];
  let successCount = 0;
  let failureCount = 0;
  let totalNewArticles = 0;
  let allProcessedArticles = [];
  
  try {
    // Initialize the page scraper
    const headless = process.env.HEADLESS !== 'false';
    await pageScraper.init(headless);
    
    for (let i = 0; i < finalSitesToScrape.length; i++) {
      const site = finalSitesToScrape[i];
      logger.section(`[${i + 1}/${finalSitesToScrape.length}] Starting scrape for: ${site.name}`);
      
      try {
        const result = await pageScraper.scrapeSite(site, config.lastScrapeDate);
        
        results.push({
          site: site.name,
          success: result.success,
          totalArticles: result.totalArticles,
          newArticles: result.newArticles,
          error: result.errorMessage
        });
        
        if (result.success) {
          successCount++;
          totalNewArticles += result.newArticles;
          allProcessedArticles = [...allProcessedArticles, ...result.articles];
          logger.success(`Successfully scraped ${site.name}`);
        } else {
          failureCount++;
          logger.error(`Failed to scrape ${site.name}: ${result.errorMessage}`);
        }
      } catch (err) {
        logger.error(`Unhandled error scraping ${site.name}: ${err.message}`);
        results.push({
          site: site.name,
          success: false,
          totalArticles: 0,
          newArticles: 0,
          error: err.message
        });
        failureCount++;
      }
    }
  } finally {
    // Clean up the browser
    await pageScraper.close();
  }
  
  // Save all processed articles to JSON
  if (allProcessedArticles.length > 0) {
    await saveArticlesToJson(allProcessedArticles);
    
    // Save to database if needed
    if (db.enabled) {
      await db.saveArticles(allProcessedArticles);
    }
  }
  
  // Generate summary report
  const summaryResult = {
    siteCount: finalSitesToScrape.length,
    successCount,
    failureCount,
    newArticles: totalNewArticles,
    results
  };
  
  await reportGenerator.generateSummaryReport(summaryResult);
  
  // Print summary
  logger.section('Scraping Summary');
  logger.stats(`Total sites attempted: ${finalSitesToScrape.length}`);
  logger.stats(`Successfully scraped: ${successCount} sites`);
  logger.stats(`Failed: ${failureCount} sites`);
  logger.stats(`New articles found: ${totalNewArticles}`);
  
  return {
    success: failureCount === 0,
    ...summaryResult
  };
}

// Export the main function
export default runScraper;

// Export utility functions for use in other files
export {
  initializeEnvironment,
  runScraper
};
