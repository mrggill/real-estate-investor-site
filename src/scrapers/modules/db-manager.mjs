// src/scrapers/modules/db-manager.mjs (Updated)
import { createClient } from '@supabase/supabase-js';
import logger from '../utils/logger.mjs';

// Singleton database manager class
class DatabaseManager {
  constructor() {
    this.supabase = null;
    this.enabled = false;
    this.initialized = false;
  }

  /**
   * Initialize the database connection
   * @returns {Promise<boolean>} - True if successfully initialized
   */
  async init() {
    if (this.initialized) return this.enabled;

    try {
      // Check if Supabase is configured
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      this.enabled = !!(supabaseUrl && supabaseKey);
      
      if (this.enabled) {
        logger.info('Initializing Supabase connection...');
        this.supabase = createClient(supabaseUrl, supabaseKey);
        await this.testConnection();
        logger.success('Supabase connection initialized');
      } else {
        logger.warning('Supabase not configured, database features disabled');
      }
      
      this.initialized = true;
      return this.enabled;
    } catch (error) {
      logger.error('Failed to initialize database connection', error);
      this.enabled = false;
      this.initialized = true;
      return false;
    }
  }

  /**
   * Test the database connection
   * @returns {Promise<boolean>} - True if connection test passed
   */
  async testConnection() {
    if (!this.enabled || !this.supabase) {
      return false;
    }

    try {
      // Fixed query: Use count() with an alias instead of count(*)
      const { data, error } = await this.supabase
        .from('articles')
        .select('id', { count: 'exact', head: true })
        .limit(1);
      
      if (error) {
        throw new Error(`Supabase connection test failed: ${error.message}`);
      }
      
      logger.database(`Successfully connected to Supabase`);
      return true;
    } catch (error) {
      logger.error('Supabase connection test failed', error);
      return false;
    }
  }

  /**
   * Get a content fingerprint for duplicate detection
   * @param {string} content - Article content
   * @returns {string} - Content fingerprint
   */
  getContentFingerprint(content) {
    // Extract first 200 characters of cleaned content as a fingerprint
    return content
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .trim()
      .slice(0, 200)         // Use beginning of article
      .toLowerCase();        // Case-insensitive comparison
  }

  /**
   * Get existing articles from the database for deduplication
   * @returns {Promise<Object>} - Sets of existing URLs and fingerprints
   */
  async getExistingArticles() {
    try {
      // If Supabase isn't enabled, return empty sets
      if (!this.enabled || !this.supabase) {
        logger.info('Supabase not configured, skipping duplicate check');
        return { urls: new Set(), fingerprints: new Set() };
      }
      
      const { data, error } = await this.supabase
        .from('articles')
        .select('url, content');
  
      if (error) {
        logger.error('Error fetching existing articles:', error);
        return { urls: new Set(), fingerprints: new Set() };
      }
  
      const urls = new Set(data.map(row => row.url));
      const fingerprints = new Set(data.map(row => 
        this.getContentFingerprint(row.content || '')));
      
      logger.stats(`Found ${urls.size} existing articles in database`);
      return { urls, fingerprints };
    } catch (err) {
      logger.error('Error getting existing articles', err);
      return { urls: new Set(), fingerprints: new Set() };
    }
  }

  /**
   * Save an article to the database
   * @param {Object} article - Article to save
   * @returns {Promise<boolean>} - True if save was successful
   */
  async saveArticle(article) {
    if (!this.enabled || !this.supabase) {
      logger.warning('Supabase not enabled, skipping database save');
      return false;
    }

    try {
      // Get column information from Supabase
      const { data: columns, error: columnError } = await this.supabase
        .from('articles')
        .select('*')
        .limit(1);
      
      if (columnError) {
        logger.error(`Error fetching schema: ${columnError.message}`);
        return false;
      }
      
      // Extract column names from the result
      const columnNames = columns && columns.length > 0 
        ? Object.keys(columns[0]) 
        : ['id', 'url', 'title', 'content', 'date']; // Fallback to basic columns
      
      logger.debug(`Available columns in database: ${columnNames.join(', ')}`);
      
      // Filter article object to only include fields that exist in the database
      const filteredArticle = {};
      for (const key of columnNames) {
        if (article[key] !== undefined) {
          filteredArticle[key] = article[key];
        }
      }
      
      // Handle camelCase to snake_case conversion for common fields
      if (article.relevanceReason && !filteredArticle.relevance_reason) {
        filteredArticle.relevance_reason = article.relevanceReason;
      }
      
      if (article.scrapedAt && !filteredArticle.scraped_at) {
        filteredArticle.scraped_at = article.scrapedAt;
      }
      
      if (article.sourceUrl && !filteredArticle.source_url) {
        filteredArticle.source_url = article.sourceUrl;
      }
      
      logger.database(`Saving article: ${filteredArticle.title}`);
      
      const { error } = await this.supabase
        .from('articles')
        .insert([filteredArticle]);
      
      if (error) {
        logger.error(`Error saving article to Supabase: ${error.message}`);
        return false;
      }
      
      logger.success(`Article saved to database: ${filteredArticle.title}`);
      return true;
    } catch (err) {
      logger.error('Error saving article to database', err);
      return false;
    }
  }

  /**
   * Save multiple articles to the database
   * @param {Array} articles - Articles to save
   * @returns {Promise<number>} - Number of articles successfully saved
   */
  async saveArticles(articles) {
    if (!this.enabled || !this.supabase) {
      logger.warning('Supabase not enabled, skipping database save');
      return 0;
    }

    try {
      logger.database(`Saving ${articles.length} articles to Supabase...`);
      let saveCount = 0;
      
      for (const article of articles) {
        const success = await this.saveArticle(article);
        if (success) saveCount++;
      }
      
      logger.success(`Successfully saved ${saveCount}/${articles.length} articles to Supabase`);
      return saveCount;
    } catch (err) {
      logger.error('Error saving articles to database', err);
      return 0;
    }
  }

  /**
   * Retrieve articles for training the relevance model
   * @param {number} limit - Maximum number of articles to retrieve
   * @returns {Promise<Array>} - Retrieved articles
   */
  async getArticlesForTraining(limit = 100) {
    if (!this.enabled || !this.supabase) {
      logger.warning('Supabase not configured, cannot get training data');
      return [];
    }

    try {
      const { data, error } = await this.supabase
        .from('articles')
        .select('id, title, content, url')
        .limit(limit);
      
      if (error) {
        logger.error(`Error fetching training data: ${error.message}`);
        return [];
      }
      
      logger.database(`Retrieved ${data.length} articles for training`);
      return data;
    } catch (err) {
      logger.error('Error retrieving training articles', err);
      return [];
    }
  }
}

// Create and export a singleton instance
const db = new DatabaseManager();
export default db;
