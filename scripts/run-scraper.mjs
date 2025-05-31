#!/usr/bin/env node
// scripts/run-scraper.mjs

import runScraper from './CombinedNewsScraper.mjs';
import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

// Initialize commander
const program = new Command();

// Setup command-line options
program
  .name('news-scraper')
  .description('Combined News Scraper for local news articles about jobs and economic development')
  .version('1.0.0')
  .option('-s, --start <number>', 'Start index in site list', '0')
  .option('-m, --max <number>', 'Maximum number of sites to scrape')
  .option('-d, --date <YYYY-MM-DD>', 'Only process articles newer than this date', '2020-01-01')
  .option('--no-ai', 'Disable AI-powered relevance detection')
  .option('-n, --site <name>', 'Scrape only the site with this name')
  .option('-l, --list', 'List all configured sites and exit')
  .option('-a, --add <url>', 'Add a new site to configuration')
  .option('--name <name>', 'Site name when adding new site')
  .option('-v, --verbose', 'Show verbose output')
  .option('--debug', 'Enable debug mode (saves more artifacts)')
  .option('--headless <boolean>', 'Run in headless mode (true/false)', 'true');

program.parse(process.argv);

const options = program.opts();

// Main function
async function main() {
  try {
    // Set environment variables from options
    if (options.debug) {
      process.env.DEBUG_MODE = 'true';
    }
    
    process.env.HEADLESS = options.headless;
    
    // Handle the list command
    if (options.list) {
      // Import the site config loader
      const { loadSiteConfig } = await import('./CombinedNewsScraper.mjs');
      const config = await loadSiteConfig();
      console.log(chalk.bold('\nConfigured Sites:'));
      
      if (!config.sites || config.sites.length === 0) {
        console.log(chalk.yellow('No sites configured. Use --add to add a new site.'));
        return;
      }
      
      config.sites.forEach((site, index) => {
        const status = site.enabled 
          ? chalk.green('✓ Enabled') 
          : chalk.yellow('⨯ Disabled');
        
        console.log(`${chalk.bold(index + 1)}. ${chalk.blue(site.name)} ${status}`);
        console.log(`   URL: ${site.url}`);
        if (site.lastScrape) {
          console.log(`   Last scraped: ${new Date(site.lastScrape).toLocaleString()}`);
        }
        console.log();
      });
      
      return;
    }
    
    // Handle the add command
    if (options.add) {
      if (!options.name) {
        console.error(chalk.red('Error: Must provide a site name with --name when adding a site'));
        process.exit(1);
      }
      
      console.log(`Attempting to add site "${options.name}" with URL "${options.add}"`);
      
      try {
        // Validate URL
        try {
          const url = new URL(options.add);
          console.log(`URL validation successful: ${url.href}`);
        } catch (urlError) {
          console.error(chalk.red(`URL validation error: ${urlError.message}`));
          process.exit(1);
        }
        
        // Import the addSiteToConfig function
        console.log('Importing addSiteToConfig function...');
        const { addSiteToConfig } = await import('./CombinedNewsScraper.mjs');
        
        console.log(`Adding site "${options.name}" with URL "${options.add}"`);
        const result = await addSiteToConfig(options.name, options.add);
        
        if (result) {
          console.log(chalk.green(`✅ Successfully added site: ${options.name}`));
        } else {
          console.error(chalk.red(`❌ Failed to add site: ${options.name}`));
        }
      } catch (err) {
        console.error(chalk.red(`❌ Error adding site: ${err.message}`));
        if (options.debug) {
          console.error(err.stack);
        }
        process.exit(1);
      }
      
      return;
    }
    
    // Convert options for the scraper
    const scraperOptions = {
      startIndex: parseInt(options.start, 10),
      maxSites: options.max ? parseInt(options.max, 10) : undefined,
      lastScrapeDate: new Date(options.date),
      enableAI: options.ai !== false,
      siteName: options.site,
      verbose: options.verbose,
      debug: options.debug
    };
    
    console.log(chalk.blue.bold('\n📰 CombinedNewsScraper'));
    console.log(chalk.blue('====================\n'));
    
    // Run the scraper
    const result = await runScraper(scraperOptions);
    
    if (result.success) {
      console.log(chalk.green.bold('\n✨ Scraper finished successfully'));
      console.log(chalk.green(`Found ${result.newArticles} new articles across ${result.successCount} sites`));
    } else {
      console.log(chalk.yellow.bold('\n⚠️ Scraper finished with some errors'));
      console.log(`Found ${result.newArticles} new articles, but ${result.failureCount} sites failed`);
      
      // Print error details for failed sites
      if (result.results) {
        const failedSites = result.results.filter(site => !site.success);
        console.log(chalk.yellow('\nFailed sites:'));
        failedSites.forEach(site => {
          console.log(chalk.yellow(`- ${site.site}: ${site.error}`));
        });
      }
    }
  } catch (err) {
    console.error(chalk.red(`\n💥 Fatal error: ${err.message}`));
    if (options.debug) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

main();