// src/scrapers/modules/report-generator.mjs
import fs from 'fs/promises';
import { ensureDir } from '../utils/file-utils.mjs';
import logger from '../utils/logger.mjs';

class ReportGenerator {
  constructor() {
    this.reportsEnabled = process.env.GENERATE_REPORTS === 'true';
  }

  /**
   * Generate a site scraping report
   * @param {string} siteName - Name of the site
   * @param {Array} articles - All scraped articles
   * @param {Array} relevantArticles - Articles deemed relevant
   * @param {Array} irrelevantArticles - Articles deemed irrelevant
   * @returns {Promise<string|null>} - Path to the report file or null if failed
   */
  async generateSiteReport(siteName, articles, relevantArticles, irrelevantArticles) {
    if (!this.reportsEnabled) {
      logger.info('Reports disabled, skipping report generation');
      return null;
    }

    try {
      // Create the reports directory if it doesn't exist
      await ensureDir('./reports/sites');
      
      // Format the report
      const report = {
        siteName,
        date: new Date().toISOString(),
        totalArticles: articles.length,
        selectedArticles: relevantArticles.map(a => ({
          url: a.url,
          title: a.title,
          date: a.date,
          relevanceReason: a.relevance_reason || a.relevanceReason || 'Not specified'
        })),
        ignoredArticles: irrelevantArticles.map(a => ({
          url: a.url,
          title: a.title,
          date: a.date,
          irrelevanceReason: a.irrelevance_reason || a.irrelevanceReason || 'Not specified'
        }))
      };
      
      // Save the report to a timestamped file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportFile = `./reports/sites/${siteName.replace(/\s+/g, '_')}_${timestamp}.json`;
      await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
      
      // Also save a simple human-readable version
      const humanReport = [
        `Scrape Report for ${siteName} - ${new Date().toLocaleString()}`,
        `Total Articles: ${articles.length}`,
        `Selected Articles: ${relevantArticles.length}`,
        `Ignored Articles: ${irrelevantArticles.length}`,
        `\nSELECTED ARTICLES:`,
        ...relevantArticles.map(a => `- ${a.title} (${a.date}) - ${a.url}`),
        `\nIGNORED ARTICLES:`,
        ...irrelevantArticles.map(a => `- ${a.title} (${a.date}) - ${a.url}`),
        `\nTo correct these selections, edit: ./feedback/article_feedback.json`
      ].join('\n');
      
      const textReportFile = `./reports/sites/${siteName.replace(/\s+/g, '_')}_${timestamp}.txt`;
      await fs.writeFile(textReportFile, humanReport);
      
      logger.success(`Generated report for ${siteName}: ${textReportFile}`);
      return reportFile;
    } catch (err) {
      logger.error('Error generating site report', err);
      return null;
    }
  }

  /**
   * Generate a summary report for a full scraping run
   * @param {Object} results - Results of the scraping run
   * @returns {Promise<string|null>} - Path to the report file or null if failed
   */
  async generateSummaryReport(results) {
    if (!this.reportsEnabled) {
      logger.info('Reports disabled, skipping summary report generation');
      return null;
    }

    try {
      // Create logs directory if it doesn't exist
      await ensureDir('./logs');
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const logFile = `./logs/scrape-results-${timestamp}.json`;
      await fs.writeFile(
        logFile,
        JSON.stringify({
          date: new Date().toISOString(),
          sites: results.siteCount || 0,
          success: results.successCount || 0,
          failed: results.failureCount || 0,
          newArticles: results.newArticles || 0,
          results: results.results || []
        }, null, 2)
      );
      
      // Generate a human-readable summary as well
      const summaryReport = [
        `Scraper Summary Report - ${new Date().toLocaleString()}`,
        `---------------------------------------------------`,
        `Total sites attempted: ${results.siteCount || 0}`,
        `Successfully scraped: ${results.successCount || 0} sites`,
        `Failed: ${results.failureCount || 0} sites`,
        `New articles found: ${results.newArticles || 0}`,
        `\nSITE DETAILS:`,
        ...(results.results || []).map(r => 
          `- ${r.site}: ${r.success ? 'SUCCESS' : 'FAILED'}, Articles: ${r.newArticles || 0}${r.error ? ` (Error: ${r.error})` : ''}`
        ),
        `\nReport generated: ${timestamp}`
      ].join('\n');
      
      const textSummaryFile = `./logs/scrape-summary-${timestamp}.txt`;
      await fs.writeFile(textSummaryFile, summaryReport);
      
      logger.success(`Saved results log to ${logFile}`);
      logger.success(`Saved summary report to ${textSummaryFile}`);
      return logFile;
    } catch (err) {
      logger.error('Error saving results log', err);
      return null;
    }
  }

  /**
   * Generate a daily summary report
   * @param {Object} stats - Daily statistics
   * @returns {Promise<string|null>} - Path to the report file or null if failed
   */
  async generateDailyReport(stats) {
    if (!this.reportsEnabled) {
      logger.info('Reports disabled, skipping daily report generation');
      return null;
    }

    try {
      // Create the reports directory if it doesn't exist
      await ensureDir('./reports/daily');
      
      const date = new Date();
      const dateString = date.toISOString().split('T')[0];
      
      const report = {
        date: date.toISOString(),
        dailyStats: stats,
        summary: {
          totalSites: stats.totalSites || 0,
          successfulSites: stats.successfulSites || 0,
          failedSites: stats.failedSites || 0,
          totalArticles: stats.totalArticles || 0,
          newArticles: stats.newArticles || 0,
          relevantArticles: stats.relevantArticles || 0
        }
      };
      
      const reportFile = `./reports/daily/report-${dateString}.json`;
      await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
      
      // Generate a human-readable report as well
      const humanReport = [
        `Daily Scraper Report - ${date.toLocaleDateString()}`,
        `---------------------------------------------------`,
        `Sites Processed: ${stats.totalSites || 0}`,
        `Successful Sites: ${stats.successfulSites || 0}`,
        `Failed Sites: ${stats.failedSites || 0}`,
        `Total Articles Found: ${stats.totalArticles || 0}`,
        `New Articles: ${stats.newArticles || 0}`,
        `Relevant Articles: ${stats.relevantArticles || 0}`,
        `\nSITE DETAILS:`,
        ...(stats.siteStats || []).map(s => 
          `- ${s.name}: ${s.success ? 'SUCCESS' : 'FAILED'}, Articles: ${s.articles || 0}`
        ),
        `\nReport generated: ${date.toLocaleString()}`
      ].join('\n');
      
      const textReportFile = `./reports/daily/report-${dateString}.txt`;
      await fs.writeFile(textReportFile, humanReport);
      
      logger.success(`Generated daily report: ${reportFile}`);
      return reportFile;
    } catch (err) {
      logger.error('Error generating daily report', err);
      return null;
    }
  }

  /**
   * Track scrape history for incremental scraping
   * @param {string} siteUrl - URL of the site
   * @param {boolean} success - Whether the scrape was successful
   * @param {number} articleCount - Number of articles found
   * @returns {Promise<boolean>} - True if successful
   */
  async updateScrapeHistory(siteUrl, success, articleCount) {
    try {
      await ensureDir('./data');
      const infoFile = './data/scrape_history.json';
      
      // Load current history
      let currentHistory = { sites: {}, lastFullScrape: null };
      try {
        const data = await fs.readFile(infoFile, 'utf8');
        currentHistory = JSON.parse(data);
      } catch (err) {
        // If file doesn't exist, create empty history
        if (err.code !== 'ENOENT') {
          logger.warning(`Error reading scrape history: ${err.message}`);
        }
      }
      
      const now = new Date().toISOString();
      
      // Update the site's entry
      currentHistory.sites[siteUrl] = {
        ...(currentHistory.sites[siteUrl] || {}),
        lastScrape: now,
        lastStatus: success ? 'success' : 'failed',
        articleCount: articleCount || 0,
        successCount: success 
          ? ((currentHistory.sites[siteUrl]?.successCount || 0) + 1)
          : (currentHistory.sites[siteUrl]?.successCount || 0),
        failureCount: !success 
          ? ((currentHistory.sites[siteUrl]?.failureCount || 0) + 1)
          : (currentHistory.sites[siteUrl]?.failureCount || 0)
      };
      
      await fs.writeFile(infoFile, JSON.stringify(currentHistory, null, 2));
      logger.info(`Updated scrape history for ${siteUrl}`);
      return true;
    } catch (err) {
      logger.error('Error updating scrape history', err);
      return false;
    }
  }

  /**
   * Load scrape history for incremental scraping
   * @returns {Promise<Object>} - Scrape history
   */
  async loadScrapeHistory() {
    try {
      const infoFile = './data/scrape_history.json';
      
      // Create directories if they don't exist
      await ensureDir('./data');
      
      try {
        const data = await fs.readFile(infoFile, 'utf8');
        return JSON.parse(data);
      } catch (err) {
        // If file doesn't exist, create empty history
        if (err.code === 'ENOENT') {
          logger.info('No scrape history found, creating new history');
          const emptyHistory = { sites: {}, lastFullScrape: null };
          await fs.writeFile(infoFile, JSON.stringify(emptyHistory, null, 2));
          return emptyHistory;
        }
        
        logger.error(`Error loading scrape history: ${err.message}`);
        return { sites: {}, lastFullScrape: null };
      }
    } catch (err) {
      logger.error('Error loading scrape history', err);
      return { sites: {}, lastFullScrape: null };
    }
  }
}

// Create and export a singleton instance
const reportGenerator = new ReportGenerator();
export default reportGenerator;
