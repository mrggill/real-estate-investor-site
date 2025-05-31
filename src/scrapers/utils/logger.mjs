// src/scrapers/utils/logger.mjs
import fs from 'fs/promises';
import { ensureDir } from './file-utils.mjs';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Emoji prefixes for different log types
const emojis = {
  info: 'ℹ️ ',
  success: '✅ ',
  warning: '⚠️ ',
  error: '❌ ',
  debug: '🔍 ',
  network: '🌐 ',
  database: '💾 ',
  file: '📄 ',
  time: '⏱️ ',
  stats: '📊 '
};

// Logger class
class Logger {
  constructor() {
    this.debugMode = process.env.DEBUG_MODE === 'true';
    this.logToFile = process.env.LOG_TO_FILE === 'true';
    this.fileHandle = null;
    this.logFile = null;
  }

  /**
   * Initialize the logger
   * @returns {Promise<void>}
   */
  async init() {
    if (this.logToFile) {
      await ensureDir('./logs');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      this.logFile = `./logs/scraper-${timestamp}.log`;
      console.log(`${emojis.info}Logging to file: ${this.logFile}`);
    }
  }

  /**
   * Write a log entry to the file
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @returns {Promise<void>}
   */
  async writeToFile(level, message) {
    if (!this.logToFile) return;
    
    try {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
      await fs.appendFile(this.logFile, logEntry);
    } catch (err) {
      console.error(`${colors.red}${emojis.error}Error writing to log file: ${err.message}${colors.reset}`);
    }
  }

  /**
   * Log an informational message
   * @param {string} message - Message to log
   * @returns {Promise<void>}
   */
  async info(message) {
    console.log(`${emojis.info}${message}`);
    await this.writeToFile('info', message);
  }

  /**
   * Log a success message
   * @param {string} message - Message to log
   * @returns {Promise<void>}
   */
  async success(message) {
    console.log(`${colors.green}${emojis.success}${message}${colors.reset}`);
    await this.writeToFile('success', message);
  }

  /**
   * Log a warning message
   * @param {string} message - Message to log
   * @returns {Promise<void>}
   */
  async warning(message) {
    console.log(`${colors.yellow}${emojis.warning}${message}${colors.reset}`);
    await this.writeToFile('warning', message);
  }

  /**
   * Log an error message
   * @param {string} message - Message to log
   * @param {Error} [error] - Optional error object
   * @returns {Promise<void>}
   */
  async error(message, error) {
    if (error) {
      console.error(`${colors.red}${emojis.error}${message}: ${error.message}${colors.reset}`);
      if (this.debugMode && error.stack) {
        console.error(`${colors.dim}${error.stack}${colors.reset}`);
      }
      await this.writeToFile('error', `${message}: ${error.message}\n${error.stack || ''}`);
    } else {
      console.error(`${colors.red}${emojis.error}${message}${colors.reset}`);
      await this.writeToFile('error', message);
    }
  }

  /**
   * Log a debug message (only in debug mode)
   * @param {string} message - Message to log
   * @returns {Promise<void>}
   */
  async debug(message) {
    if (this.debugMode) {
      console.log(`${colors.dim}${emojis.debug}${message}${colors.reset}`);
      await this.writeToFile('debug', message);
    }
  }

  /**
   * Log a network-related message
   * @param {string} message - Message to log
   * @returns {Promise<void>}
   */
  async network(message) {
    console.log(`${colors.blue}${emojis.network}${message}${colors.reset}`);
    await this.writeToFile('network', message);
  }

  /**
   * Log a database-related message
   * @param {string} message - Message to log
   * @returns {Promise<void>}
   */
  async database(message) {
    console.log(`${colors.magenta}${emojis.database}${message}${colors.reset}`);
    await this.writeToFile('database', message);
  }

  /**
   * Log a file-related message
   * @param {string} message - Message to log
   * @returns {Promise<void>}
   */
  async file(message) {
    console.log(`${colors.cyan}${emojis.file}${message}${colors.reset}`);
    await this.writeToFile('file', message);
  }

  /**
   * Log a time-related message
   * @param {string} message - Message to log
   * @returns {Promise<void>}
   */
  async time(message) {
    console.log(`${emojis.time}${message}`);
    await this.writeToFile('time', message);
  }

  /**
   * Log statistics
   * @param {string} message - Message to log
   * @returns {Promise<void>}
   */
  async stats(message) {
    console.log(`${colors.cyan}${emojis.stats}${message}${colors.reset}`);
    await this.writeToFile('stats', message);
  }

  /**
   * Log a section header
   * @param {string} title - Section title
   * @returns {Promise<void>}
   */
  async section(title) {
    const line = '='.repeat(title.length + 4);
    console.log(`\n${colors.bright}${line}${colors.reset}`);
    console.log(`${colors.bright}  ${title}  ${colors.reset}`);
    console.log(`${colors.bright}${line}${colors.reset}\n`);
    await this.writeToFile('section', `\n${line}\n  ${title}  \n${line}\n`);
  }
}

// Create and export a singleton logger instance
const logger = new Logger();
export default logger;
