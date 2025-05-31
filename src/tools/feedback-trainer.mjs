// src/tools/feedback-trainer.mjs
import 'dotenv/config';
import fs from 'fs/promises';
import readline from 'readline';
import feedbackManager from '../scrapers/modules/feedback-manager.mjs';
import { getSiteConfigs } from '../scrapers/modules/config-manager.mjs';
import logger from '../scrapers/utils/logger.mjs';

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Ask a question and get user input
 * @param {string} question - Question to ask
 * @returns {Promise<string>} - User's answer
 */
const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

/**
 * Read articles from JSON file
 * @returns {Promise<Array>} - Articles from file
 */
const readArticlesFromFile = async () => {
  try {
    const data = await fs.readFile('./public/data/articles.json', 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading articles file: ${err.message}`);
    return [];
  }
};

/**
 * Main training function
 */
const trainFeedbackSystem = async () => {
  try {
    // Initialize
    await logger.init();
    logger.section("FEEDBACK TRAINING SYSTEM");
    
    // Load feedback
    const feedback = await feedbackManager.loadFeedback();
    logger.info(`Loaded existing feedback with ${feedback.includedArticles.length} included and ${feedback.excludedArticles.length} excluded articles`);
    
    // Load sites
    const sites = await getSiteConfigs();
    logger.info(`Loaded ${sites.length} site configurations`);
    
    // Read articles
    const articles = await readArticlesFromFile();
    logger.info(`Loaded ${articles.length} articles from file`);
    
    if (articles.length === 0) {
      logger.error("No articles found. Please run the scraper first.");
      rl.close();
      return;
    }
    
    // Display training menu
    console.log("\nFEEDBACK TRAINING OPTIONS:");
    console.log("1. Review recent articles");
    console.log("2. Search for specific articles");
    console.log("3. Manage keywords");
    console.log("4. Export feedback");
    console.log("5. Exit");
    
    const choice = await askQuestion("\nSelect an option (1-5): ");
    
    switch (choice) {
      case '1':
        await reviewRecentArticles(articles, feedback);
        break;
      case '2':
        await searchArticles(articles, feedback);
        break;
      case '3':
        await manageKeywords(feedback);
        break;
      case '4':
        await exportFeedback(feedback);
        break;
      case '5':
        logger.info("Exiting training system");
        break;
      default:
        logger.warning("Invalid option selected");
        break;
    }
    
    rl.close();
  } catch (err) {
    logger.error("Error in training system", err);
    rl.close();
  }
};

/**
 * Review most recent articles
 * @param {Array} articles - Articles to review
 * @param {Object} feedback - Feedback data
 */
const reviewRecentArticles = async (articles, feedback) => {
  // Sort by date, newest first
  const sortedArticles = [...articles].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Take the 20 most recent articles
  const recentArticles = sortedArticles.slice(0, 20);
  
  logger.info(`Reviewing the 20 most recent articles`);
  
  let count = 0;
  for (const article of recentArticles) {
    count++;
    
    // Check if already in feedback
    const isIncluded = feedback.includedArticles.includes(article.url);
    const isExcluded = feedback.excludedArticles.includes(article.url);
    
    // Display article info
    console.log(`\n[${count}/20] Article: "${article.title}"`);
    console.log(`Date: ${article.date}`);
    console.log(`URL: ${article.url}`);
    console.log(`Source: ${article.source}`);
    
    if (article.summary) {
      console.log(`Summary: ${article.summary}`);
    }
    
    // Show current status
    if (isIncluded) {
      console.log("Current status: INCLUDED in relevant articles");
    } else if (isExcluded) {
      console.log("Current status: EXCLUDED from relevant articles");
    } else {
      console.log("Current status: Not rated");
    }
    
    // Ask for feedback
    const response = await askQuestion("Include this article? (y/n/s/q - yes/no/skip/quit): ");
    
    if (response.toLowerCase() === 'q') {
      logger.info("Quitting review process");
      break;
    }
    
    if (response.toLowerCase() === 's') {
      continue;
    }
    
    if (response.toLowerCase() === 'y') {
      // Include the article
      if (!isIncluded) {
        feedback.includedArticles.push(article.url);
        // Remove from excluded if it's there
        feedback.excludedArticles = feedback.excludedArticles.filter(url => url !== article.url);
        await feedbackManager.saveFeedback(feedback);
        logger.success(`Added "${article.title}" to included articles`);
      }
    } else if (response.toLowerCase() === 'n') {
      // Exclude the article
      if (!isExcluded) {
        feedback.excludedArticles.push(article.url);
        // Remove from included if it's there
        feedback.includedArticles = feedback.includedArticles.filter(url => url !== article.url);
        await feedbackManager.saveFeedback(feedback);
        logger.success(`Added "${article.title}" to excluded articles`);
      }
    }
  }
  
  logger.success("Review completed");
};

/**
 * Search for specific articles
 * @param {Array} articles - Articles to search
 * @param {Object} feedback - Feedback data
 */
const searchArticles = async (articles, feedback) => {
  const searchTerm = await askQuestion("Enter search term (title, content, or URL): ");
  
  if (!searchTerm || searchTerm.trim() === '') {
    logger.warning("Search term is empty, returning to main menu");
    return;
  }
  
  const searchTermLower = searchTerm.toLowerCase();
  
  // Find matching articles
  const matchingArticles = articles.filter(article => 
    article.title.toLowerCase().includes(searchTermLower) ||
    article.url.toLowerCase().includes(searchTermLower) ||
    (article.content && article.content.toLowerCase().includes(searchTermLower))
  );
  
  if (matchingArticles.length === 0) {
    logger.warning(`No articles found matching "${searchTerm}"`);
    return;
  }
  
  logger.info(`Found ${matchingArticles.length} articles matching "${searchTerm}"`);
  
  // Ask if user wants to review them
  const reviewResponse = await askQuestion(`Review these ${matchingArticles.length} articles? (y/n): `);
  
  if (reviewResponse.toLowerCase() !== 'y') {
    return;
  }
  
  let count = 0;
  for (const article of matchingArticles) {
    count++;
    
    // Check if already in feedback
    const isIncluded = feedback.includedArticles.includes(article.url);
    const isExcluded = feedback.excludedArticles.includes(article.url);
    
    // Display article info
    console.log(`\n[${count}/${matchingArticles.length}] Article: "${article.title}"`);
    console.log(`Date: ${article.date}`);
    console.log(`URL: ${article.url}`);
    console.log(`Source: ${article.source}`);
    
    if (article.summary) {
      console.log(`Summary: ${article.summary}`);
    }
    
    // Show current status
    if (isIncluded) {
      console.log("Current status: INCLUDED in relevant articles");
    } else if (isExcluded) {
      console.log("Current status: EXCLUDED from relevant articles");
    } else {
      console.log("Current status: Not rated");
    }
    
    // Ask for feedback
    const response = await askQuestion("Include this article? (y/n/s/q - yes/no/skip/quit): ");
    
    if (response.toLowerCase() === 'q') {
      logger.info("Quitting review process");
      break;
    }
    
    if (response.toLowerCase() === 's') {
      continue;
    }
    
    if (response.toLowerCase() === 'y') {
      // Include the article
      if (!isIncluded) {
        feedback.includedArticles.push(article.url);
        // Remove from excluded if it's there
        feedback.excludedArticles = feedback.excludedArticles.filter(url => url !== article.url);
        await feedbackManager.saveFeedback(feedback);
        logger.success(`Added "${article.title}" to included articles`);
      }
    } else if (response.toLowerCase() === 'n') {
      // Exclude the article
      if (!isExcluded) {
        feedback.excludedArticles.push(article.url);
        // Remove from included if it's there
        feedback.includedArticles = feedback.includedArticles.filter(url => url !== article.url);
        await feedbackManager.saveFeedback(feedback);
        logger.success(`Added "${article.title}" to excluded articles`);
      }
    }
  }
  
  logger.success("Review completed");
};

/**
 * Manage keywords for relevance detection
 * @param {Object} feedback - Feedback data
 */
const manageKeywords = async (feedback) => {
  console.log("\nKEYWORD MANAGEMENT:");
  console.log("1. View current keywords");
  console.log("2. Add keywords");
  console.log("3. Remove keywords");
  console.log("4. Return to main menu");
  
  const choice = await askQuestion("\nSelect an option (1-4): ");
  
  switch (choice) {
    case '1':
      // View current keywords
      console.log("\nADDED KEYWORDS (will be included in searches):");
      if (feedback.keywordAdditions.length === 0) {
        console.log("  No keywords added");
      } else {
        feedback.keywordAdditions.forEach((keyword, index) => {
          console.log(`  ${index + 1}. ${keyword}`);
        });
      }
      
      console.log("\nREMOVED KEYWORDS (will be excluded from searches):");
      if (feedback.keywordRemovals.length === 0) {
        console.log("  No keywords removed");
      } else {
        feedback.keywordRemovals.forEach((keyword, index) => {
          console.log(`  ${index + 1}. ${keyword}`);
        });
      }
      break;
      
    case '2':
      // Add keywords
      {
        const keyword = await askQuestion("Enter keyword to add: ");
        if (keyword && keyword.trim() !== '') {
          if (!feedback.keywordAdditions.includes(keyword)) {
            feedback.keywordAdditions.push(keyword);
            // Remove from removals if it's there
            feedback.keywordRemovals = feedback.keywordRemovals.filter(kw => kw !== keyword);
            await feedbackManager.saveFeedback(feedback);
            logger.success(`Added keyword "${keyword}" to additions`);
          } else {
            logger.info(`Keyword "${keyword}" is already in additions`);
          }
        }
      }
      break;
      
    case '3':
      // Remove keywords
      {
        const keyword = await askQuestion("Enter keyword to remove: ");
        if (keyword && keyword.trim() !== '') {
          if (!feedback.keywordRemovals.includes(keyword)) {
            feedback.keywordRemovals.push(keyword);
            // Remove from additions if it's there
            feedback.keywordAdditions = feedback.keywordAdditions.filter(kw => kw !== keyword);
            await feedbackManager.saveFeedback(feedback);
            logger.success(`Added keyword "${keyword}" to removals`);
          } else {
            logger.info(`Keyword "${keyword}" is already in removals`);
          }
        }
      }
      break;
      
    case '4':
      logger.info("Returning to main menu");
      break;
      
    default:
      logger.warning("Invalid option selected");
      break;
  }
};

/**
 * Export feedback to a readable file
 * @param {Object} feedback - Feedback data
 */
const exportFeedback = async (feedback) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportFile = `./feedback/export-${timestamp}.txt`;
    
    const content = [
      `FEEDBACK EXPORT (${new Date().toLocaleString()})`,
      `========================================`,
      `\nINCLUDED ARTICLES (${feedback.includedArticles.length}):`,
      ...feedback.includedArticles.map(url => `- ${url}`),
      `\nEXCLUDED ARTICLES (${feedback.excludedArticles.length}):`,
      ...feedback.excludedArticles.map(url => `- ${url}`),
      `\nADDED KEYWORDS (${feedback.keywordAdditions.length}):`,
      ...feedback.keywordAdditions.map(keyword => `- ${keyword}`),
      `\nREMOVED KEYWORDS (${feedback.keywordRemovals.length}):`,
      ...feedback.keywordRemovals.map(keyword => `- ${keyword}`)
    ].join('\n');
    
    await fs.writeFile(exportFile, content);
    
    logger.success(`Exported feedback to ${exportFile}`);
  } catch (err) {
    logger.error("Error exporting feedback", err);
  }
};

// Run the trainer if this file is executed directly
if (import.meta.url.endsWith(process.argv[1])) {
  trainFeedbackSystem();
}

export { trainFeedbackSystem };
