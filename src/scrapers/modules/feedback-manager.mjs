// src/scrapers/modules/feedback-manager.mjs
import fs from 'fs/promises';
import { ensureDir } from '../utils/file-utils.mjs';
import logger from '../utils/logger.mjs';

class FeedbackManager {
  constructor() {
    this.feedbackFile = './feedback/article_feedback.json';
    this.feedback = {
      includedArticles: [], // URLs that should be included
      excludedArticles: [], // URLs that should be excluded
      keywordAdditions: [], // Keywords to add to relevance detection
      keywordRemovals: []   // Keywords to remove from relevance detection
    };
    this.loaded = false;
  }

  /**
   * Load feedback from file
   * @returns {Promise<Object>} Feedback data
   */
  async loadFeedback() {
    try {
      // If already loaded, return cached data
      if (this.loaded) {
        return this.feedback;
      }
      
      // Create the directory if it doesn't exist
      await ensureDir('./feedback');
      
      try {
        const feedbackData = await fs.readFile(this.feedbackFile, 'utf8');
        this.feedback = JSON.parse(feedbackData);
        this.loaded = true;
        logger.info(`Loaded feedback with ${this.feedback.includedArticles.length} included and ${this.feedback.excludedArticles.length} excluded articles`);
        return this.feedback;
      } catch (err) {
        // If file doesn't exist or is invalid, start with empty feedback
        if (err.code === 'ENOENT') {
          logger.info('No existing feedback file, starting with empty feedback');
        } else {
          logger.warning(`Error parsing feedback file: ${err.message}`);
        }
        
        // Save default empty feedback
        await this.saveFeedback(this.feedback);
        this.loaded = true;
        return this.feedback;
      }
    } catch (err) {
      logger.error('Error loading feedback', err);
      // Return default empty feedback as fallback
      return {
        includedArticles: [],
        excludedArticles: [],
        keywordAdditions: [],
        keywordRemovals: []
      };
    }
  }

  /**
   * Save feedback to file
   * @param {Object} feedback Feedback data to save
   * @returns {Promise<boolean>} True if successful
   */
  async saveFeedback(feedback) {
    try {
      // Merge with current feedback if partial update
      if (feedback !== this.feedback) {
        this.feedback = {
          ...this.feedback,
          ...feedback
        };
      }
      
      await ensureDir('./feedback');
      await fs.writeFile(this.feedbackFile, JSON.stringify(this.feedback, null, 2));
      logger.success('Saved feedback');
      return true;
    } catch (err) {
      logger.error('Error saving feedback', err);
      return false;
    }
  }

  /**
   * Add a URL to the included articles list
   * @param {string} url URL to include
   * @returns {Promise<boolean>} True if successful
   */
  async includeArticle(url) {
    await this.loadFeedback();
    
    // Check if URL is already included
    if (this.feedback.includedArticles.includes(url)) {
      return true;
    }
    
    // Remove from excluded if it's there
    this.feedback.excludedArticles = this.feedback.excludedArticles.filter(item => item !== url);
    
    // Add to included
    this.feedback.includedArticles.push(url);
    
    return await this.saveFeedback(this.feedback);
  }

  /**
   * Add a URL to the excluded articles list
   * @param {string} url URL to exclude
   * @returns {Promise<boolean>} True if successful
   */
  async excludeArticle(url) {
    await this.loadFeedback();
    
    // Check if URL is already excluded
    if (this.feedback.excludedArticles.includes(url)) {
      return true;
    }
    
    // Remove from included if it's there
    this.feedback.includedArticles = this.feedback.includedArticles.filter(item => item !== url);
    
    // Add to excluded
    this.feedback.excludedArticles.push(url);
    
    return await this.saveFeedback(this.feedback);
  }

  /**
   * Add a keyword to the additions list
   * @param {string} keyword Keyword to add
   * @returns {Promise<boolean>} True if successful
   */
  async addKeyword(keyword) {
    await this.loadFeedback();
    
    // Check if keyword is already added
    if (this.feedback.keywordAdditions.includes(keyword)) {
      return true;
    }
    
    // Remove from removals if it's there
    this.feedback.keywordRemovals = this.feedback.keywordRemovals.filter(item => item !== keyword);
    
    // Add to additions
    this.feedback.keywordAdditions.push(keyword);
    
    return await this.saveFeedback(this.feedback);
  }

  /**
   * Add a keyword to the removals list
   * @param {string} keyword Keyword to remove
   * @returns {Promise<boolean>} True if successful
   */
  async removeKeyword(keyword) {
    await this.loadFeedback();
    
    // Check if keyword is already removed
    if (this.feedback.keywordRemovals.includes(keyword)) {
      return true;
    }
    
    // Remove from additions if it's there
    this.feedback.keywordAdditions = this.feedback.keywordAdditions.filter(item => item !== keyword);
    
    // Add to removals
    this.feedback.keywordRemovals.push(keyword);
    
    return await this.saveFeedback(this.feedback);
  }

  /**
   * Check if a URL is explicitly included in feedback
   * @param {string} url URL to check
   * @returns {Promise<boolean>} True if URL is in the included list
   */
  async isArticleIncluded(url) {
    const feedback = await this.loadFeedback();
    return feedback.includedArticles.includes(url);
  }

  /**
   * Check if a URL is explicitly excluded in feedback
   * @param {string} url URL to check
   * @returns {Promise<boolean>} True if URL is in the excluded list
   */
  async isArticleExcluded(url) {
    const feedback = await this.loadFeedback();
    return feedback.excludedArticles.includes(url);
  }
}

// Create and export a singleton instance
const feedbackManager = new FeedbackManager();
export default feedbackManager;
