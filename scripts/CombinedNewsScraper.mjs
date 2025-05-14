// scripts/CombinedNewsScraper.mjs

import 'dotenv/config';
import { chromium } from 'playwright';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import zlib from 'zlib';
import util from 'util';

// Setup Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const openaiApiKey = process.env.OPENAI_API_KEY;

// Helper functions
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const randomSleep = async (min, max) => {
  const sleepTime = Math.floor(Math.random() * (max - min + 1)) + min;
  await sleep(sleepTime);
};

// Create necessary directories
const initDirectories = async () => {
  const dirs = [
    './debug',
    './data',
    './config',
    './feedback',
    './reports',
    './reports/daily',
    './reports/sites',
  ];
  
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
};

// Compression helpers
const compress = util.promisify(zlib.gzip);
const compressHtml = async (html, filename) => {
  const compressed = await compress(Buffer.from(html));
  await fs.writeFile(`./debug/${filename}.html.gz`, compressed);
  console.log(`📋 Saved compressed HTML snapshot to ./debug/${filename}.html.gz`);
};
// Save HTML for debugging
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
  
  // Check if element is in viewport
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
  
  // Backoff strategy for rate limiting
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
  // SITE CONFIGURATION MANAGEMENT
// This is where you add/change/remove sites to be scraped

// Function to load the site configuration
const loadSiteConfig = async () => {
    try {
      const configFile = './config/sites.json';
      
      // Create config directory if it doesn't exist
      await fs.mkdir('./config', { recursive: true });
      
      try {
        const data = await fs.readFile(configFile, 'utf8');
        return JSON.parse(data);
      } catch (err) {
        // If file doesn't exist, create a default config
        console.log('ℹ️ No site configuration found, creating default configuration');
        
        const defaultConfig = {
          sites: [
            {
              name: "Axios Dallas",
              url: "https://www.axios.com/local/dallas/news",
              enabled: true,
              scrapeOptions: {
                selectors: {
                  articleLinks: [
                    'a[href*="/2025/"]:not([href*="membership"])',
                    'a[href*="/2024/"]:not([href*="membership"])',
                    'a[href*="/2023/"]:not([href*="membership"])',
                    'a[href*="/2022/"]:not([href*="membership"])',
                    'a[href*="/2021/"]:not([href*="membership"])',
                    'a[href*="/2020/"]:not([href*="membership"])',
                    'article a[href*="/local/dallas/20"]',
                    'div[data-cy*="gridContent"] a[href*="/local/dallas/20"]',
                    'div[data-cy*="collection"] a[href*="/20"]'
                  ],
                  content: [
                    'article[data-cy="articleContent"]',
                    'div[data-cy="articleBody"]',
                    'div.article-body',
                    'div[data-cy="articleContent"]',
                    'main article',
                    'article',
                    'div[role="main"]',
                    'main div[data-cy]'
                  ]
                },
                loadMoreAttempts: 100,
                scrollBehavior: "infinite",
                waitForSelector: "main"
              }
            }
            // Add more sites here in the same format
          ]
        };
        
        await fs.writeFile(configFile, JSON.stringify(defaultConfig, null, 2));
        return defaultConfig;
      }
    } catch (err) {
      console.error(`❌ Error loading site configuration: ${err.message}`);
      return { sites: [] };
    }
  };
  
  // Function to save the site configuration
  const saveSiteConfig = async (config) => {
    try {
      const configFile = './config/sites.json';
      await fs.writeFile(configFile, JSON.stringify(config, null, 2));
      console.log('✅ Site configuration saved successfully');
    } catch (err) {
      console.error(`❌ Error saving site configuration: ${err.message}`);
    }
  };
  
  // Helper function to add a new site to the configuration
  // You can call this function from a separate script to add sites
  const addSiteToConfig = async (siteName, siteUrl, options = {}) => {
    try {
      const config = await loadSiteConfig();
      
      // Check if site already exists
      const existingIndex = config.sites.findIndex(site => site.url === siteUrl);
      
      if (existingIndex >= 0) {
        console.log(`📝 Site ${siteName} already exists, updating configuration`);
        config.sites[existingIndex] = {
          ...config.sites[existingIndex],
          name: siteName,
          enabled: options.enabled !== undefined ? options.enabled : true,
          scrapeOptions: {
            ...config.sites[existingIndex].scrapeOptions,
            ...options.scrapeOptions
          }
        };
      } else {
        console.log(`📝 Adding new site: ${siteName}`);
        config.sites.push({
          name: siteName,
          url: siteUrl,
          enabled: options.enabled !== undefined ? options.enabled : true,
          scrapeOptions: {
            selectors: {
              articleLinks: options.scrapeOptions?.selectors?.articleLinks || [
                'a[href*="/2025/"]',
                'a[href*="/2024/"]',
                'a[href*="/2023/"]',
                'a[href*="/2022/"]',
                'a[href*="/2021/"]',
                'a[href*="/2020/"]'
              ],
              content: options.scrapeOptions?.selectors?.content || [
                'article',
                '.article-body',
                'main',
                '.content',
                '.post-content'
              ]
            },
            loadMoreAttempts: options.scrapeOptions?.loadMoreAttempts || 100,
            scrollBehavior: options.scrapeOptions?.scrollBehavior || "infinite",
            waitForSelector: options.scrapeOptions?.waitForSelector || "main"
          }
        });
      }
      
      await saveSiteConfig(config);
      console.log(`✅ Site ${siteName} added/updated in configuration`);
      return true;
    } catch (err) {
      console.error(`❌ Error adding site to configuration: ${err.message}`);
      return false;
    }
  };
  // INCREMENTAL SCRAPING MANAGEMENT

// Function to load the last scrape date for each site
const loadLastScrapeInfo = async () => {
    try {
      const infoFile = './data/scrape_history.json';
      
      // Create directories if they don't exist
      await fs.mkdir('./data', { recursive: true });
      
      try {
        const data = await fs.readFile(infoFile, 'utf8');
        return JSON.parse(data);
      } catch (err) {
        // If file doesn't exist, create empty history
        console.log('ℹ️ No scrape history found, creating new history');
        const emptyHistory = { sites: {}, lastFullScrape: null };
        await fs.writeFile(infoFile, JSON.stringify(emptyHistory, null, 2));
        return emptyHistory;
      }
    } catch (err) {
      console.error(`❌ Error loading scrape history: ${err.message}`);
      return { sites: {}, lastFullScrape: null };
    }
  };
  
  // Function to update the last scrape date for a site
  const updateScrapeInfo = async (siteUrl, success, articleCount) => {
    try {
      const infoFile = './data/scrape_history.json';
      const currentHistory = await loadLastScrapeInfo();
      
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
      console.log(`📝 Updated scrape history for ${siteUrl}`);
    } catch (err) {
      console.error(`❌ Error updating scrape history: ${err.message}`);
    }
  };
  // FEEDBACK SYSTEM

// Function to load feedback for improving article selection
const loadFeedback = async () => {
    try {
      const feedbackFile = './feedback/article_feedback.json';
      
      // Create the directory if it doesn't exist
      await fs.mkdir('./feedback', { recursive: true });
      
      try {
        const feedbackData = await fs.readFile(feedbackFile, 'utf8');
        return JSON.parse(feedbackData);
      } catch (err) {
        // If file doesn't exist or is invalid, start with empty feedback
        console.log('ℹ️ No existing feedback file, starting with empty feedback');
        const emptyFeedback = {
          includedArticles: [], // URLs that should be included
          excludedArticles: [], // URLs that should be excluded
          keywordAdditions: [], // Keywords to add to relevance detection
          keywordRemovals: []   // Keywords to remove from relevance detection
        };
        await fs.writeFile(feedbackFile, JSON.stringify(emptyFeedback, null, 2));
        return emptyFeedback;
      }
    } catch (err) {
      console.error(`❌ Error loading feedback: ${err.message}`);
      // Return empty feedback as fallback
      return {
        includedArticles: [],
        excludedArticles: [],
        keywordAdditions: [],
        keywordRemovals: []
      };
    }
  };
  
  // Function to save feedback
  const saveFeedback = async (feedback) => {
    try {
      const feedbackFile = './feedback/article_feedback.json';
      await fs.writeFile(feedbackFile, JSON.stringify(feedback, null, 2));
      console.log('✅ Saved feedback');
    } catch (err) {
      console.error(`❌ Error saving feedback: ${err.message}`);
    }
  };
  
  // Function to generate error report
  const generateErrorReport = async (siteName, articles, relevantArticles, irrelevantArticles) => {
    try {
      // Create the reports directory if it doesn't exist
      await fs.mkdir('./reports/sites', { recursive: true });
      
      // Format the report
      const report = {
        siteName,
        date: new Date().toISOString(),
        totalArticles: articles.length,
        selectedArticles: relevantArticles.map(a => ({
          url: a.url,
          title: a.title,
          date: a.date,
          relevanceReason: a.relevanceReason || 'Not specified'
        })),
        ignoredArticles: irrelevantArticles.map(a => ({
          url: a.url,
          title: a.title,
          date: a.date,
          irrelevanceReason: a.irrelevanceReason || 'Not specified'
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
      
      console.log(`📝 Generated report for ${siteName}: ${textReportFile}`);
      return reportFile;
    } catch (err) {
      console.error(`❌ Error generating report: ${err.message}`);
      return null;
    }
  };
  // ARTICLE RELEVANCE DETECTION

// Default job-related keywords
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
    'business district',
    
    // Infrastructure and economic development
    'construction', 'build', 'building', 'development', 'expansion', 'expand',
    'project', 'investment', 'investing', 'infrastructure', 'economic development',
    'growth', 'billion dollar', 'million dollar',
    
    // Added: Government funding and civic projects
    'subsidy', 'subsidies', 'incentive', 'grant', 'funding', 'funds',
    'public funds', 'tax credit', 'tax break', 'abatement', 'bond', 'bonds',
    'municipal', 'council approves', 'city approves', 'city council',
    'redevelopment', 'revitalization', 'urban renewal', 'downtown',
    'mixed-use', 'development project', 'lofts', 'housing development',
    'affordable housing', 'residential', 'commercial',
    
    // Added: Airport and transportation terms
    'terminal', 'airport expansion', 'runway', 'gate', 'gates',
    'transit', 'transportation', 'passenger', 'aviation',
    'air travel', 'flight', 'airline', 'american airlines', 'southwest'
  ];
  
  // Function to check if article is related to jobs using keywords
  function isJobRelatedByKeywords(title, content, extraKeywords = [], excludeKeywords = []) {
    // Combine default keywords with extra keywords and remove excluded ones
    const enhancedKeywords = [
      ...jobKeywords,
      ...extraKeywords
    ].filter(kw => !excludeKeywords.includes(kw));
  
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();
    
    // Critical keyword check in title
    const criticalKeywords = [
      'terminal', 'airport', 'council approves', 'subsidy',
      'million', 'billion', 'project', 'development',
      'construction', 'funding', 'economic', 'american airlines',
      'dfw', 'lofts', 'city council'
    ];
    
    for (const criticalTerm of criticalKeywords) {
      if (titleLower.includes(criticalTerm)) {
        console.log(`✅ Critical keyword found in title: "${criticalTerm}"`);
        return true;
      }
    }
    
    // Check if any keywords are in the title (higher weight)
    const titleMatch = enhancedKeywords.some(keyword => titleLower.includes(keyword));
    if (titleMatch) return true;
    
    // Enhanced dollar amount detection - check both title and content
    const dollarRegex = /\$\s*\d+(\.\d+)?\s*(million|billion|m|b|k)?/i;
    if (titleLower.match(dollarRegex)) {
      console.log('💰 Dollar amount found in title');
      return true;
    }
    
    const firstParagraph = contentLower.split('\n\n')[0] || '';
    if (firstParagraph.match(dollarRegex)) {
      console.log('💰 Dollar amount found in first paragraph');
      return true;
    }
    
    // Check for phrases related to government funding or approval
    const fundingPhrases = [
      'approves funding', 'approved funding', 
      'approves subsidy', 'approved subsidy',
      'announces investment', 'announced investment',
      'approves plan', 'approved plan',
      'receives grant', 'received grant',
      'awarded contract', 'awards contract',
      'city council vote', 'council voted'
    ];
    
    for (const phrase of fundingPhrases) {
      if (contentLower.includes(phrase)) {
        return true;
      }
    }
    
    // Special case for city council or government approvals
    if ((titleLower.includes('city') || titleLower.includes('council') || 
         titleLower.includes('mayor') || titleLower.includes('approves')) &&
        (contentLower.includes('project') || contentLower.includes('development') || 
         contentLower.includes('plan') || contentLower.includes('fund'))) {
      return true;
    }
    
    // Special case for airports (which create many jobs)
    if ((titleLower.includes('airport') || titleLower.includes('airline') || 
        titleLower.includes('american airlines') || titleLower.includes('terminal')) &&
        (contentLower.includes('new') || contentLower.includes('plan') || 
         contentLower.includes('develop') || contentLower.includes('build'))) {
      return true;
    }
    
    // Check if multiple keywords are in the content (for better accuracy)
    let keywordCount = 0;
    for (const keyword of enhancedKeywords) {
      if (contentLower.includes(keyword)) {
        keywordCount++;
        // If we find 3 or more different job-related keywords, consider it relevant
        if (keywordCount >= 3) return true;
      }
    }
    
    return false;
  }
  // Function to check if article is related to jobs using AI
const isJobRelevantWithAI = async (title, content) => {
    if (!openaiApiKey) {
      console.log('⚠️ No OpenAI API key found, using keyword-based filtering');
      return { 
        isRelevant: isJobRelatedByKeywords(title, content), 
        explanation: 'Determined by keyword matching (AI unavailable)' 
      };
    }
  
    try {
      // Enhanced AI prompt for relevance check
      const prompt = `
  Article Title: "${title}"
  Article Content:
  ${content.slice(0, 1000)}${content.length > 1000 ? '...' : ''}
  Question: Is this article relevant to jobs, employment, economic development, or business expansion?
  Consider the following criteria:
  1. Does it discuss job creation, job losses, hiring, or employment trends?
  2. Does it mention new businesses, facilities, or expansions that would create jobs?
  3. Does it involve significant infrastructure projects (like airports, buildings, factories, terminals) that would impact employment?
  4. Does it discuss economic development initiatives, business relocations, or company investments?
  5. Does it mention manufacturing, production, distribution centers, logistics, or industrial facilities?
  6. Does it discuss city/municipal funding, subsidies, or approval for development projects?
  7. Does it mention dollar amounts for investments, developments, or economic initiatives?
  8. Does it involve transportation infrastructure improvements that could create jobs?
  Answer with ONLY "Yes" or "No" first, then explain your reasoning in one sentence.
  `;
  
      // Call the OpenAI API
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.3, // Lower temperature for more consistent responses
          max_tokens: 150 // Keep it brief
        },
        {
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const aiResponse = response.data.choices[0].message.content.trim();
      
      // Extract the Yes/No answer
      const isRelevant = aiResponse.toLowerCase().startsWith('yes');
      
      return {
        isRelevant,
        explanation: aiResponse.replace(/^(yes|no)[.,: ]*/i, '').trim()
      };
    } catch (error) {
      console.error('Error calling OpenAI API:', error.message);
      // Default to keyword-based filtering if API fails
      return { 
        isRelevant: isJobRelatedByKeywords(title, content), 
        explanation: 'AI analysis failed, falling back to keywords' 
      };
    }
  };
  
  // Function to correct grammatical errors in title using AI
  const correctGrammarWithAI = async (title) => {
    if (!openaiApiKey) {
      console.log('⚠️ No OpenAI API key found, skipping grammar correction');
      return title;
    }
  
    try {
      // Prepare a prompt for the AI
      const prompt = `
  Correct any spelling, grammatical errors, or typos in the following text. If there are no errors, return the original text unchanged:
  "${title}"
  Only return the corrected text, with no additional comments or explanations.
  `;
  
      // Call the OpenAI API
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.0, // Use zero temperature for consistent corrections
          max_tokens: 100 // Keep it brief
        },
        {
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const correctedTitle = response.data.choices[0].message.content.trim();
      
      // Only return the corrected title if it's different from the original
      if (correctedTitle !== title) {
        console.log(`✏️ Corrected title: "${title}" → "${correctedTitle}"`);
      }
      
      return correctedTitle;
    } catch (error) {
      console.error('Error calling OpenAI API for grammar correction:', error.message);
      // Return original title if correction fails
      return title;
    }
  };
  
  // Function to generate a summary using OpenAI
  const generateSummaryWithAI = async (content) => {
    if (!openaiApiKey) return null;
  
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
            Authorization: `Bearer ${openaiApiKey}`,
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
  // ADAPTIVE LEARNING MODEL

// Function to create a content fingerprint for duplicate detection
function getContentFingerprint(content) {
    // Extract first 200 characters of cleaned content as a fingerprint
    return content
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .trim()
      .slice(0, 200)         // Use beginning of article
      .toLowerCase();        // Case-insensitive comparison
  }
  
  // Function to build a relevance model from training examples
  const buildRelevanceModel = (articles, relevanceResults) => {
    // Extract features from articles that were marked as relevant
    const relevantArticles = articles.filter(article => 
      relevanceResults.some(r => r.url === article.url && r.isRelevant)
    );
    
    if (relevantArticles.length === 0) {
      console.log('⚠️ No relevant articles to build model from, using defaults');
      return null;
    }
    
    // Extract patterns from relevant articles
    const patternCollection = {
      titlePatterns: {},
      contentPatterns: {},
      dollarAmounts: 0,
      cityMentions: 0,
      infrastructureProjects: 0,
      governmentApprovals: 0
    };
    
    // Analyze each relevant article to find common patterns
    relevantArticles.forEach(article => {
      const title = article.title?.toLowerCase() || '';
      const content = article.content?.toLowerCase() || '';
      
      // Count word frequencies in titles
      title.split(/\s+/).forEach(word => {
        if (word.length > 3) { // Skip short words
          patternCollection.titlePatterns[word] = (patternCollection.titlePatterns[word] || 0) + 1;
        }
      });
      
      // Count phrase patterns in content
      const phrases = [];
      for (let i = 0; i < content.split(/\s+/).length - 2; i++) {
        const phrase = content.split(/\s+/).slice(i, i + 3).join(' ');
        if (phrase.length > 10) {
          phrases.push(phrase);
        }
      }
      
      phrases.forEach(phrase => {
        patternCollection.contentPatterns[phrase] = (patternCollection.contentPatterns[phrase] || 0) + 1;
      });
      
      // Check for dollar amounts
      if (/\$\s*\d+(\.\d+)?\s*(million|billion|m|b)?/i.test(title) || 
          /\$\s*\d+(\.\d+)?\s*(million|billion|m|b)?/i.test(content.substring(0, 500))) {
        patternCollection.dollarAmounts++;
      }
      
      // Check for city mentions
      if (/city|dallas|fort worth|plano|arlington|frisco/i.test(title)) {
        patternCollection.cityMentions++;
      }
      
      // Check for infrastructure projects
      if (/project|development|construct|build|expansion/i.test(title)) {
        patternCollection.infrastructureProjects++;
      }
      
      // Check for government approvals
    if (/approve|council|vote|plan|subsidy|funding/i.test(title)) {
        patternCollection.governmentApprovals++;
      }
    });
    
    // Extract top patterns
    const topTitleWords = Object.entries(patternCollection.titlePatterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(entry => entry[0]);
      
    const topContentPhrases = Object.entries(patternCollection.contentPatterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(entry => entry[0]);
    
    // Create a scoring model
    return {
      topTitleWords,
      topContentPhrases,
      featureImportance: {
        dollarAmounts: patternCollection.dollarAmounts / relevantArticles.length,
        cityMentions: patternCollection.cityMentions / relevantArticles.length,
        infrastructureProjects: patternCollection.infrastructureProjects / relevantArticles.length,
        governmentApprovals: patternCollection.governmentApprovals / relevantArticles.length
      }
    };
  };
  
  // Function to evaluate article relevance using the learned model
  const evaluateArticleWithModel = (article, model) => {
    if (!model) {
      return { score: 0, isRelevant: false };
    }
  
    const title = article.title?.toLowerCase() || '';
    const content = article.content?.toLowerCase() || '';
    
    let score = 0;
    
    // Check for top title words
    model.topTitleWords.forEach(word => {
      if (title.includes(word)) {
        score += 1;
      }
    });
    
    // Check for top content phrases
    model.topContentPhrases.forEach(phrase => {
      if (content.includes(phrase)) {
        score += 0.5;
      }
    });
    
    // Check for feature importance
    if (/\$\s*\d+(\.\d+)?\s*(million|billion|m|b)?/i.test(title) || 
        /\$\s*\d+(\.\d+)?\s*(million|billion|m|b)?/i.test(content.substring(0, 500))) {
      score += 3 * model.featureImportance.dollarAmounts;
    }
    
    if (/city|dallas|fort worth|plano|arlington|frisco/i.test(title)) {
      score += 2 * model.featureImportance.cityMentions;
    }
    
    if (/project|development|construct|build|expansion/i.test(title)) {
      score += 2 * model.featureImportance.infrastructureProjects;
    }
    
    if (/approve|council|vote|plan|subsidy|funding/i.test(title)) {
      score += 3 * model.featureImportance.governmentApprovals;
    }
    
    return {
      score,
      isRelevant: score >= 3 // Threshold for relevance
    };
  };
  
  // Enhanced function to determine relevance using feedback and model
  const determineRelevance = async (article, content, feedback, relevanceModel) => {
    const { url, title } = article;
    
    // Check explicit inclusion/exclusion first
    if (feedback.includedArticles.includes(url)) {
      return {
        isRelevant: true,
        explanation: 'Explicitly included via feedback'
      };
    }
    
    if (feedback.excludedArticles.includes(url)) {
      return {
        isRelevant: false,
        explanation: 'Explicitly excluded via feedback'
      };
    }
    
    // Apply keyword additions and removals to the content check
    const checkKeywords = () => isJobRelatedByKeywords(
      title, 
      content, 
      feedback.keywordAdditions, 
      feedback.keywordRemovals
    );
    
    // First use the model if available
    if (relevanceModel) {
      const evaluation = evaluateArticleWithModel(
        { title, content }, 
        relevanceModel
      );
      
      // High confidence in model
      if (evaluation.score >= 4) {
        return {
          isRelevant: true,
          explanation: `Strong relevance detected by model (score: ${evaluation.score.toFixed(2)})`
        };
      } else if (evaluation.score <= 1) {
        return {
          isRelevant: false,
          explanation: `Article deemed not relevant by model (score: ${evaluation.score.toFixed(2)})`
        };
      }
      
      // Model uncertainty, check keywords
      if (checkKeywords()) {
        return {
          isRelevant: true,
          explanation: `Relevant by keyword matching (model score: ${evaluation.score.toFixed(2)})`
        };
      }
    } else {
      // No model, check keywords
      if (checkKeywords()) {
        return {
          isRelevant: true,
          explanation: 'Relevant by keyword matching'
        };
      }
    }
    
    // Fall back to AI if we have a key
    if (openaiApiKey) {
      try {
        const aiResult = await isJobRelevantWithAI(title, content);
        return aiResult;
      } catch (err) {
        console.log(`⚠️ AI analysis failed: ${err.message}, falling back to keywords`);
        return {
          isRelevant: checkKeywords(),
          explanation: 'AI failed, determined by keyword matching'
        };
      }
    }
    
    // Default to keywords if all else fails
    return {
      isRelevant: checkKeywords(),
      explanation: 'Determined by keyword matching'
    };
  };
  // Function to check if date is recent enough (>=Jan 1, 2020)
function isRecentEnough(dateStr) {
    try {
      const articleDate = new Date(dateStr);
      const minDate = new Date('2020-01-01');
      
      // Add debugging to verify dates
      console.log(`📅 Comparing dates - Article: ${articleDate.toISOString().slice(0, 10)}, Min: 2020-01-01`);
      
      // Check if the date is valid before comparing
      if (isNaN(articleDate.getTime())) {
        console.log(`⚠️ Invalid date: ${dateStr}, defaulting to recent`);
        return true;
      }
      
      // Use >= to include Jan 1, 2020
      return articleDate >= minDate;
    } catch (err) {
      console.error(`❌ Error checking date: ${err.message}, defaulting to recent`);
      return true; // Default to keeping the article if date checking fails
    }
  }
  
  // Function to get existing articles from the database
  const getExistingArticles = async () => {
    try {
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
    } catch (err) {
      console.error(`❌ Error getting existing articles: ${err.message}`);
      return { urls: new Set(), fingerprints: new Set() };
    }
  };
  
  // Function to save articles to JSON file
  const saveArticlesToJson = async (articles) => {
    try {
      // Create the directory if it doesn't exist
      await fs.mkdir('./public/data', { recursive: true });
      
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
  
  // Function to scrape a single site
  const scrapeSingleSite = async (site, lastScrapeDate) => {
    console.log(`🌐 Starting scrape for ${site.name}...`);
    console.log(`🔍 Only processing articles newer than ${lastScrapeDate.toISOString().slice(0, 10)}`);
    
    // Default result structure
    const result = {
      success: false,
      totalArticles: 0,
      newArticles: 0,
      errorMessage: null
    };
    
    let browser;
    
    try {
      // Create debug directory if it doesn't exist
      await fs.mkdir('./debug', { recursive: true });
      
      console.log('🚀 Launching browser...');
      browser = await chromium.launch({
        headless: true // Set to false for debugging
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
      // Go to site URL
    console.log(`🌐 Visiting ${site.name} at ${site.url}...`);
    try {
      // First try to go directly to an archive view if one exists
      const baseUrl = new URL(site.url);
      const possibleArchiveUrls = [
        new URL('/archives', baseUrl).toString(),
        new URL('/archive', baseUrl).toString(),
        new URL(site.url + '/archives').toString(),
        new URL(site.url + '/archive').toString()
      ];
      
      let archiveFound = false;
      for (const archiveUrl of possibleArchiveUrls) {
        try {
          console.log(`🔍 Checking for archive page at ${archiveUrl}`);
          const response = await page.goto(archiveUrl, { 
            waitUntil: 'networkidle',
            timeout: 30000
          });
          
          if (response.status() >= 200 && response.status() < 300) {
            console.log(`✅ Found archive page at ${archiveUrl}`);
            archiveFound = true;
            break;
          }
        } catch (archiveErr) {
          console.log(`⚠️ Archive page not found at ${archiveUrl}`);
        }
      }
      
      // If no archive found, go to the main URL
      if (!archiveFound) {
        await page.goto(site.url, { 
          waitUntil: 'networkidle',
          timeout: 60000
        });
      }
      
      // Check if page loaded successfully
      const title = await page.title();
      console.log(`📑 Page title: "${title}"`);
      
      if (!title || title.includes('Error') || title.includes('Access Denied')) {
        throw new Error('Page did not load correctly');
      }
      
      console.log('✅ Page loaded successfully');
      console.log(`📄 Current URL: ${page.url()}`);
      await saveHtmlForDebugging(page, `${site.name.replace(/\s+/g, '_')}-initial-load`);
      
    } catch (err) {
      console.error(`❌ Error navigating to ${site.url}: ${err.message}`);
      await saveHtmlForDebugging(page, 'navigation-error');
      await browser.close();
      
      result.errorMessage = `Failed to navigate to site: ${err.message}`;
      return result;
    }

    // Handle cookie consent banner if it appears
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
          break;
        }
      }
    } catch (err) {
      console.log('ℹ️ No cookie banner found or unable to click');
    }

    // Wait for content to initialize
    console.log('⌛ Waiting for content to initialize...');
    try {
      if (site.scrapeOptions?.waitForSelector) {
        await page.waitForSelector(site.scrapeOptions.waitForSelector, { timeout: 30000 });
      } else {
        await page.waitForSelector('main, article, .content, body', { timeout: 30000 });
      }
      await sleep(3000); // Extra wait to ensure dynamic content loads
    } catch (err) {
      console.error('❌ Timeout waiting for main content:', err.message);
      await saveHtmlForDebugging(page, 'timeout-main');
      
      // We'll continue anyway and try to find content
      console.log('⚠️ Continuing despite timeout on main content...');
    }
    
    // Log article count before starting
    console.log('📊 Checking initial number of article links...');
    let initialArticleCount = 0;
    try {
      const linkSelectors = site.scrapeOptions?.selectors?.articleLinks || [
        'a[href*="/2025/"]', 'a[href*="/2024/"]', 'a[href*="/2023/"]',
        'a[href*="/2022/"]', 'a[href*="/2021/"]', 'a[href*="/2020/"]'
      ];
      
      for (const selector of linkSelectors) {
        const links = await page.$$(selector);
        initialArticleCount += links.length;
      }
      
      console.log(`🔢 Initial article count: ${initialArticleCount}`);
    } catch (err) {
      console.error(`❌ Error counting initial articles: ${err.message}`);
      initialArticleCount = 0;
    }

    // Flag to track if we've reached 2020 content
    let reached2020Content = false;
    console.log('📜 Starting sequential load more process...');
    
    // Track if we've made progress
    let previousArticleCount = initialArticleCount;
    let noProgressCount = 0;
    const maxNoProgressAttempts = 5;
    let loadMoreCount = 0;
    const buttonAttempts = site.scrapeOptions?.loadMoreAttempts || 100; 
    
    // Load more content
    for (let i = 0; i < buttonAttempts; i++) {
      console.log(`🔄 Load more attempt ${i+1}/${buttonAttempts}...`);
      
      // First, scroll down to bottom to ensure any lazy-loaded buttons appear
      console.log('⬇️ Scrolling to bottom of page...');
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await sleep(3000);
      
      // Check if we've reached content from 2020
      let has2020Articles = false;
      try {
        has2020Articles = await page.$$eval('a[href*="/2020/"]', links => links.length > 0);
      } catch (err) {
        console.log('⚠️ Error checking for 2020 articles');
      }
      
      if (has2020Articles && !reached2020Content) {
        console.log('🎯 Found articles from 2020! Will continue a bit further to get more 2020 content.');
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
            console.log(`📅 Oldest 2020 article found: ${oldest2020ArticleDate}`);
            
            // If we've reached January or close to it, we can stop
            if (oldest2020ArticleDate <= '2020-02-01') {
              console.log('🏁 Reached early 2020 content, stopping load more process');
              break;
            }
          }
        } catch (err) {
          console.log(`⚠️ Error analyzing 2020 article dates: ${err.message}`);
        }
      }
      // Save the state at this point only every 5 iterations to save disk space
      if (i % 5 === 0) {
        await saveHtmlForDebugging(page, `${site.name.replace(/\s+/g, '_')}-before-load-more-${i}`);
      }

      // Look for various types of "load more" buttons with multiple possible selectors
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
            console.log(`Note: Couldn't take button screenshot: ${screenshotErr.message}`);
          }
          
          // Click the button and wait for new content to load
          console.log('👆 Clicking "load more" button...');
          try {
            await button.click();
            console.log('⏳ Waiting for new stories to load...');
            await sleep(5000); // Wait for new content to load
            
            // Save the state after clicking every 5 iterations
            if (i % 5 === 0) {
              await saveHtmlForDebugging(page, `${site.name.replace(/\s+/g, '_')}-after-load-more-${i}`);
            }
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
      let currentArticleCount = 0;
      try {
        const linkSelectors = site.scrapeOptions?.selectors?.articleLinks || [
          'a[href*="/2025/"]', 'a[href*="/2024/"]', 'a[href*="/2023/"]',
          'a[href*="/2022/"]', 'a[href*="/2021/"]', 'a[href*="/2020/"]'
        ];
        
        for (const selector of linkSelectors) {
          const links = await page.$$(selector);
          currentArticleCount += links.length;
        }
        
        console.log(`🔢 Current article count: ${currentArticleCount} (previously: ${previousArticleCount})`);
      } catch (err) {
        console.error(`❌ Error counting current articles: ${err.message}`);
        currentArticleCount = previousArticleCount;
      }
      
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
        console.log('🔄 No button found, trying different scroll patterns...');
        
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
    console.log(`📊 Load more process complete. Clicked ${loadMoreCount} load more buttons.`);
    
    console.log('📋 Saving final page state for analysis...');
    await saveHtmlForDebugging(page, `${site.name.replace(/\s+/g, '_')}-final-page-state`);

    console.log('🔎 Collecting articles with multiple selectors...');
    
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
      console.log(`🔍 Trying selector: ${selector}`);
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
const uniqueArticles = Array.from(
    new Map(articles.map(item => [item.url, item])).values()
  )
  .filter(item => {
    // Filter out navigation links
    if (item.url.endsWith('/') || item.url.includes('/category/') || 
        item.url.includes('/tag/') || item.url.includes('/author/')) {
      return false;
    }
    
    // Make sure the date is valid and recent enough
    return isRecentEnough(item.date);
  });
  
  console.log(`📊 Found ${uniqueArticles.length} unique articles after filtering`);
  
  // Get existing article URLs for deduplication
  console.log('🔍 Checking for existing articles...');
  const { urls: existingUrls, fingerprints: existingFingerprints } = await getExistingArticles();
  
  // Process each article by visiting the page and extracting content
  const processedArticles = [];
  const maxArticlesToProcess = site.scrapeOptions?.maxArticles || 50;
  let processedCount = 0;
  
  console.log(`⚙️ Processing up to ${maxArticlesToProcess} articles...`);
  
  for (const article of uniqueArticles) {
    // Stop if we've processed enough articles
    if (processedCount >= maxArticlesToProcess) {
      console.log(`🛑 Reached maximum articles to process (${maxArticlesToProcess})`);
      break;
    }
    
    // Skip if we already have this article
    if (existingUrls.has(article.url)) {
      console.log(`⏩ Skipping existing article: ${article.title}`);
      continue;
    }
    
    try {
      console.log(`\n [${processedCount + 1}/${maxArticlesToProcess}] Processing article: ${article.title}`);
      console.log(`🔗 URL: ${article.url}`);
      
      await page.goto(article.url, { 
        waitUntil: 'networkidle',
        timeout: 30000
      });
      
      // Wait for the article content to load
      await page.waitForSelector('article, .article, .post, main, .content', { 
        timeout: 10000 
      }).catch(() => console.log('⚠️ Could not find an article selector, continuing anyway'));
      
      await sleep(2000);
      
      // Extract the content
      const content = await page.evaluate(() => {
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
      
      // Extract additional metadata
      const metadata = await page.evaluate(() => {
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
      
      // Generate a fingerprint of the content to avoid duplicates
      const fingerprint = getContentFingerprint(content);
      if (existingFingerprints.has(fingerprint)) {
        console.log(`👯 Skipping article with duplicate content fingerprint`);
        continue;
      }
      
      // Create a unique ID for the article
      const id = crypto.randomUUID();
      
      const processedArticle = {
        id,
        title: article.title,
        url: article.url,
        date: article.date,
        content,
        source: site.name,
        source_url: site.url,
        city: metadata.city || '',
        state: metadata.state || '',
        summary: metadata.summary || ''
      };
      
      // Check if this article is relevant based on keyword matching or AI
      const relevance = await determineRelevance(
        processedArticle, 
        content, 
        userFeedback,
        relevanceModel
      );
      
      if (relevance.isRelevant) {
        console.log(`✅ Article is relevant: ${relevance.explanation}`);
        processedArticles.push(processedArticle);
        processedCount++;
      } else {
        console.log(`❌ Article is not relevant: ${relevance.explanation}`);
      }
      
    } catch (err) {
      console.error(`❌ Error processing article: ${err.message}`);
    }
    
    // Wait between article requests to avoid overloading the server
    await sleep(2000);
  }
  
  await browser.close();
  
  console.log(`\n🎉 Scrape complete for ${site.name}!`);
  console.log(`📊 Found ${uniqueArticles.length} unique articles`);
  console.log(`🔢 Processed ${processedCount} new articles`);
  console.log(`📝 ${processedArticles.length} relevant articles after filtering`);
  
  // Save the results
  if (processedArticles.length > 0) {
    // Save to JSON file
    await saveArticlesToJson(processedArticles);
    
    // Save to database if needed
    if (supabaseEnabled) {
      console.log('💾 Saving articles to Supabase...');
      try {
        for (const article of processedArticles) {
          const { error } = await supabase
            .from('articles')
            .insert([article]);
          
          if (error) {
            console.error(`❌ Error saving article to Supabase: ${error.message}`);
          }
        }
        console.log(`✅ Successfully saved articles to Supabase`);
      } catch (err) {
        console.error(`❌ Error saving to Supabase: ${err.message}`);
      }
    }
  }
}
  result.success = true;
  result.totalArticles = uniqueArticles.length;
  result.newArticles = processedArticles.length;
  return result;
  };

  // CombinedNewsScraper.mjs - Part 13 (Utility Functions)
  
  // Function to check if an element is in viewport
  async function isInViewport(element) {
    return await element.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    });
  }
  
  // Sleep function for waiting
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Function to create a content fingerprint to identify duplicate articles
  function getContentFingerprint(content) {
    // Normalize content by removing extra spaces and lowercasing
    const normalized = content
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
      .slice(0, 1000); // Use first 1000 chars for efficiency
    
    // Use crypto to create a hash
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }
  
  // Function to save HTML for debugging purposes
  async function saveHtmlForDebugging(page, prefix) {
    try {
      const debugDir = './debug';
      await fs.mkdir(debugDir, { recursive: true });
      
      const content = await page.content();
      const filename = `${debugDir}/${prefix}-${Date.now()}.html`;
      await fs.writeFile(filename, content);
      
      console.log(`📄 Saved debug HTML to ${filename}`);
      
      // Also take a screenshot
      const screenshotFilename = `${debugDir}/${prefix}-${Date.now()}.png`;
      await page.screenshot({ path: screenshotFilename, fullPage: false });
      
      console.log(`📸 Saved screenshot to ${screenshotFilename}`);
    } catch (err) {
      console.error(`❌ Error saving debug files: ${err.message}`);
    }
  }
  
  // CombinedNewsScraper.mjs - Part 14 (Main Function)
  
  // Main function to run the scraper
  async function runScraper(options = {}) {
    console.log('\n🚀 Starting CombinedNewsScraper...');
    
    // Configure options with defaults
    const config = {
      sites: options.sites || siteConfigs,
      maxSites: options.maxSites || Infinity,
      startIndex: options.startIndex || 0,
      lastScrapeDate: options.lastScrapeDate || new Date('2020-01-01'),
      enableAI: options.enableAI !== false,
      ...options
    };
    
    console.log(`🔧 Configuration:`);
    console.log(`📅 Only processing articles newer than: ${config.lastScrapeDate.toISOString().slice(0, 10)}`);
    console.log(`🤖 AI-based relevance detection: ${config.enableAI ? 'Enabled' : 'Disabled'}`);
    
    // Initialize feedback and models
    let userFeedback = await loadUserFeedback();
    console.log(`👥 Loaded user feedback with ${userFeedback.includedArticles.length} included and ${userFeedback.excludedArticles.length} excluded articles`);
    
    // Train relevance model if AI is enabled
    let relevanceModel = null;
    if (config.enableAI) {
      try {
        console.log('🧠 Training adaptive learning model...');
        relevanceModel = await trainRelevanceModel();
        console.log('✅ Model trained successfully');
      } catch (err) {
        console.error(`❌ Error training model: ${err.message}`);
        console.log('⚠️ Continuing without AI-based relevance detection');
      }
    }
    
    // Track results
    const results = [];
    let successCount = 0;
    let failureCount = 0;
    let totalNewArticles = 0;
    
    // Get list of sites to scrape
    const sitesToScrape = config.sites.slice(config.startIndex, config.startIndex + config.maxSites);
    
    console.log(`\n🔍 Will scrape ${sitesToScrape.length} sites`);
    
    for (let i = 0; i < sitesToScrape.length; i++) {
      const site = sitesToScrape[i];
      console.log(`\n[${i + 1}/${sitesToScrape.length}] 🌐 Starting scrape for: ${site.name}`);
      
      try {
        const result = await scrapeSingleSite(site, config.lastScrapeDate);
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
          console.log(`✅ Successfully scraped ${site.name}`);
        } else {
          failureCount++;
          console.log(`❌ Failed to scrape ${site.name}: ${result.errorMessage}`);
        }
      } catch (err) {
        console.error(`💥 Unhandled error scraping ${site.name}: ${err.message}`);
        results.push({
          site: site.name,
          success: false,
          totalArticles: 0,
          newArticles: 0,
          error: err.message
        });
        failureCount++;
      }
      
      // Small delay between sites
      if (i < sitesToScrape.length - 1) {
        console.log(`😴 Waiting before starting next site...`);
        await sleep(5000);
      }
    }
    
    // Print summary
    console.log('\n📋 Scraping Summary:');
    console.log(`🔢 Total sites attempted: ${sitesToScrape.length}`);
    console.log(`✅ Successfully scraped: ${successCount} sites`);
    console.log(`❌ Failed: ${failureCount} sites`);
    console.log(`📝 New articles found: ${totalNewArticles}`);
    
    // Save results log
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      await fs.writeFile(
        `./logs/scrape-results-${timestamp}.json`,
        JSON.stringify(results, null, 2)
      );
      console.log(`💾 Saved results log to ./logs/scrape-results-${timestamp}.json`);
    } catch (err) {
      console.error(`❌ Error saving results log: ${err.message}`);
    }
    
    return {
      success: failureCount === 0,
      siteCount: sitesToScrape.length,
      successCount,
      failureCount,
      newArticles: totalNewArticles,
      results
    };
  }
  
  // Export the main function
  export default runScraper;
  
  // If this file is run directly (not imported), run the scraper
  if (import.meta.url === process.argv[1]) {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const options = {};
    
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--start' && args[i+1]) {
        options.startIndex = parseInt(args[i+1], 10);
        i++;
      } else if (args[i] === '--max' && args[i+1]) {
        options.maxSites = parseInt(args[i+1], 10);
        i++;
      } else if (args[i] === '--date' && args[i+1]) {
        options.lastScrapeDate = new Date(args[i+1]);
        i++;
      } else if (args[i] === '--no-ai') {
        options.enableAI = false;
      }
    }
    
    // Run the scraper
    runScraper(options)
      .then(() => {
        console.log('✨ Scraper finished successfully');
        process.exit(0);
      })
      .catch(err => {
        console.error(`💥 Fatal error: ${err.message}`);
        process.exit(1);
      });
  }