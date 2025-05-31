// src/scrapers/utils/file-utils.mjs
import fs from 'fs/promises';
import path from 'path';
import zlib from 'zlib';
import util from 'util';

// Compression helpers
export const compress = util.promisify(zlib.gzip);

/**
 * Ensures a directory exists, creating it if necessary
 * @param {string} dir - Directory path to create
 * @returns {Promise<boolean>} - True if successful
 */
export const ensureDir = async (dir) => {
  try {
    await fs.mkdir(dir, { recursive: true });
    return true;
  } catch (err) {
    console.error(`❌ Error creating directory ${dir}: ${err.message}`);
    return false;
  }
};

/**
 * Initialize all required directories for the application
 * @returns {Promise<boolean>} - True if successful
 */
export const initDirectories = async () => {
  const dirs = [
    './debug',
    './data',
    './config',
    './feedback',
    './reports',
    './reports/daily',
    './reports/sites',
    './logs',
    './public/data'
  ];
  
  try {
    for (const dir of dirs) {
      await ensureDir(dir);
    }
    return true;
  } catch (err) {
    console.error(`❌ Error initializing directories: ${err.message}`);
    return false;
  }
};

/**
 * Compresses HTML content and saves it to a file
 * @param {string} html - HTML content to compress
 * @param {string} filename - Base filename (without extension)
 * @returns {Promise<void>}
 */
export const compressHtml = async (html, filename) => {
  try {
    const compressed = await compress(Buffer.from(html));
    await ensureDir('./debug');
    await fs.writeFile(`./debug/${filename}.html.gz`, compressed);
    console.log(`📋 Saved compressed HTML snapshot to ./debug/${filename}.html.gz`);
  } catch (err) {
    console.error(`❌ Error compressing HTML: ${err.message}`);
  }
};

/**
 * Save HTML content and a screenshot for debugging
 * @param {Page} page - Playwright page object
 * @param {string} filename - Base filename (without extension)
 * @returns {Promise<void>}
 */
export const saveHtmlForDebugging = async (page, filename) => {
  try {
    const html = await page.content();
    
    // Create debug directory if it doesn't exist
    await ensureDir('./debug');
    
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

/**
 * Save articles to a JSON file
 * @param {Array} articles - Articles to save
 * @returns {Promise<void>}
 */
export const saveArticlesToJson = async (articles) => {
  try {
    // Create the directory if it doesn't exist
    await ensureDir('./public/data');
    
    // Read existing articles if file exists
    let existingArticles = [];
    try {
      const existingData = await fs.readFile('./public/data/articles.json', 'utf8');
      existingArticles = JSON.parse(existingData);
      console.log(`📊 Read ${existingArticles.length} articles from existing file`);
    } catch (err) {
      // File doesn't exist or is invalid JSON, start fresh
      console.log('ℹ️ No existing articles file found, creating new one');
    }
    
    // Create a backup of the existing file
    if (existingArticles.length > 0) {
      await fs.writeFile(
        './public/data/articles_backup_before_job_filter.json', 
        JSON.stringify(existingArticles, null, 2)
      );
      console.log('📦 Created backup of existing articles');
    }
    
    // Combine new and existing articles, removing duplicates by URL
    const allUrls = new Set(existingArticles.map(a => a.url));
    const combinedArticles = [...existingArticles];
    
    for (const article of articles) {
      if (!allUrls.has(article.url)) {
        combinedArticles.push(article);
        allUrls.add(article.url);
      }
    }
    
    // Sort by date, newest first
    combinedArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Write the combined articles to the file
    await fs.writeFile(
      './public/data/articles.json', 
      JSON.stringify(combinedArticles, null, 2)
    );
    
    console.log(`✅ Saved ${combinedArticles.length} articles to JSON file (${articles.length} new)`);
  } catch (err) {
    console.error(`❌ Error saving articles to JSON: ${err.message}`);
  }
};
