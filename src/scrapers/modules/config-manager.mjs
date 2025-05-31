// src/scrapers/modules/config-manager.mjs
import fs from 'fs/promises';

// Function to load the site configuration
export const loadSiteConfig = async () => {
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
export const saveSiteConfig = async (config) => {
  try {
    const configFile = './config/sites.json';
    await fs.writeFile(configFile, JSON.stringify(config, null, 2));
    console.log('✅ Site configuration saved successfully');
    return true;
  } catch (err) {
    console.error(`❌ Error saving site configuration: ${err.message}`);
    return false;
  }
};

// Helper function to add a new site to the configuration
export const addSiteToConfig = async (siteName, siteUrl, options = {}) => {
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

// Function to get site configs for main function
export const getSiteConfigs = async () => {
  const config = await loadSiteConfig();
  return config.sites || [];
};

// Function to remove a site from the configuration
export const removeSiteFromConfig = async (siteUrl) => {
  try {
    const config = await loadSiteConfig();
    
    // Check if site exists
    const existingIndex = config.sites.findIndex(site => site.url === siteUrl);
    
    if (existingIndex === -1) {
      console.log(`⚠️ Site with URL ${siteUrl} not found in configuration`);
      return false;
    }
    
    // Remove the site
    const siteName = config.sites[existingIndex].name;
    config.sites.splice(existingIndex, 1);
    
    await saveSiteConfig(config);
    console.log(`✅ Site ${siteName} removed from configuration`);
    return true;
  } catch (err) {
    console.error(`❌ Error removing site from configuration: ${err.message}`);
    return false;
  }
};

// Toggle site enabled status
export const toggleSiteEnabled = async (siteUrl, enabled) => {
  try {
    const config = await loadSiteConfig();
    
    // Check if site exists
    const existingIndex = config.sites.findIndex(site => site.url === siteUrl);
    
    if (existingIndex === -1) {
      console.log(`⚠️ Site with URL ${siteUrl} not found in configuration`);
      return false;
    }
    
    // Update enabled status
    const siteName = config.sites[existingIndex].name;
    config.sites[existingIndex].enabled = enabled;
    
    await saveSiteConfig(config);
    console.log(`✅ Site ${siteName} ${enabled ? 'enabled' : 'disabled'}`);
    return true;
  } catch (err) {
    console.error(`❌ Error updating site status: ${err.message}`);
    return false;
  }
};