// src/cli/scraper-cli.mjs
import runScraper from '../scrapers/index.mjs';
import logger from '../scrapers/utils/logger.mjs';

/**
 * Parse command line arguments
 * @returns {Object} - Parsed options
 */
const parseCommandLineArguments = () => {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--start' || args[i] === '-s') && args[i+1]) {
      options.startIndex = parseInt(args[i+1], 10);
      i++;
    } else if ((args[i] === '--max' || args[i] === '-m') && args[i+1]) {
      options.maxSites = parseInt(args[i+1], 10);
      i++;
    } else if ((args[i] === '--date' || args[i] === '-d') && args[i+1]) {
      options.lastScrapeDate = new Date(args[i+1]);
      i++;
    } else if (args[i] === '--no-ai') {
      options.enableAI = false;
    } else if ((args[i] === '--site' || args[i] === '-n') && args[i+1]) {
      options.siteName = args[i+1];
      i++;
    } else if (args[i] === '--debug') {
      process.env.DEBUG_MODE = 'true';
    } else if (args[i] === '--log-file') {
      process.env.LOG_TO_FILE = 'true';
    } else if (args[i] === '--no-headless') {
      process.env.HEADLESS = 'false';
    } else if (args[i] === '--help' || args[i] === '-h') {
      showHelp();
      process.exit(0);
    }
  }
  
  return options;
};

/**
 * Display help information
 */
const showHelp = () => {
  console.log(`
News Scraper - Command Line Options:
  --start, -s <number>     : Start index in site list (default: 0)
  --max, -m <number>       : Maximum number of sites to scrape (default: all)
  --date, -d <YYYY-MM-DD>  : Only process articles newer than this date (default: 2020-01-01)
  --no-ai                  : Disable AI-powered relevance detection
  --site, -n <name>        : Scrape only the site with this name
  --debug                  : Enable debug mode (saves more debug files)
  --log-file               : Log output to a file
  --no-headless            : Run browser in non-headless mode
  --help, -h               : Show this help message
`);
};

/**
 * Run the scraper from the command line
 */
const runFromCommandLine = async () => {
  try {
    // Parse command line arguments
    const options = parseCommandLineArguments();
    
    // Initialize logger
    await logger.init();
    
    // Run the scraper
    const result = await runScraper(options);
    
    if (result.success) {
      logger.success('Scraper finished successfully');
      process.exit(0);
    } else {
      logger.error(`Scraper encountered errors: ${result.failureCount} sites failed`);
      process.exit(1);
    }
  } catch (err) {
    logger.error('Fatal error', err);
    if (process.env.DEBUG_MODE === 'true') {
      console.error(err.stack);
    }
    process.exit(1);
  }
};

// If this file is run directly (not imported), run the scraper
if (import.meta.url.endsWith(process.argv[1])) {
  runFromCommandLine();
}

export { runFromCommandLine, parseCommandLineArguments };
