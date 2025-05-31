// src/scrapers/utils/time-utils.mjs

/**
 * Pause execution for a specified time
 * @param {number} ms - Time to sleep in milliseconds
 * @returns {Promise<void>}
 */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sleep for a random amount of time between min and max milliseconds
 * Adds jitter for more human-like behavior
 * @param {number} min - Minimum sleep time in milliseconds
 * @param {number} max - Maximum sleep time in milliseconds
 * @returns {Promise<void>}
 */
export const randomSleep = async (min, max) => {
  const sleepTime = Math.floor(Math.random() * (max - min + 1)) + min;
  // Add some jitter for more human-like behavior
  const jitter = Math.random() > 0.5 ? 1 : -1;
  const jitterAmount = Math.floor(Math.random() * 500) * jitter;
  const finalSleepTime = Math.max(min, sleepTime + jitterAmount);
  
  console.log(`😴 Waiting for ${(finalSleepTime/1000).toFixed(1)} seconds...`);
  await sleep(finalSleepTime);
};

/**
 * Check if a date string is recent enough (>= specified minimum date)
 * @param {string} dateStr - Date string to check
 * @param {string} minDateStr - Minimum date string (default: '2020-01-01')
 * @returns {boolean} - True if date is recent enough
 */
export function isRecentEnough(dateStr, minDateStr = '2020-01-01') {
  try {
    const articleDate = new Date(dateStr);
    const minDate = new Date(process.env.MIN_ARTICLE_DATE || minDateStr);
    
    // Add debugging to verify dates
    console.log(`📅 Comparing dates - Article: ${articleDate.toISOString().slice(0, 10)}, Min: ${minDate.toISOString().slice(0, 10)}`);
    
    // Check if the date is valid before comparing
    if (isNaN(articleDate.getTime())) {
      console.log(`⚠️ Invalid date: ${dateStr}, defaulting to recent`);
      return true;
    }
    
    // Use >= to include the minimum date
    return articleDate >= minDate;
  } catch (err) {
    console.error(`❌ Error checking date: ${err.message}, defaulting to recent`);
    return true; // Default to keeping the article if date checking fails
  }
}

/**
 * Backoff strategy for rate limiting
 * @returns {Object} Backoff strategy methods
 */
export const createBackoffStrategy = () => {
  let attempts = 0;
  const maxAttempts = 5;
  
  return {
    shouldRetry: () => attempts < maxAttempts,
    wait: async () => {
      attempts++;
      // Base exponential backoff
      const baseWait = Math.pow(2, attempts) * 10000;
      // Add randomness (up to 20% variance)
      const jitterPercentage = (Math.random() * 0.2) - 0.1; // -10% to +10%
      const waitTime = Math.floor(baseWait * (1 + jitterPercentage));
      
      console.log(`⏱️ Rate limit detected. Backing off for ${(waitTime/1000).toFixed(1)} seconds (attempt ${attempts}/${maxAttempts})...`);
      await sleep(waitTime);
    },
    reset: () => {
      attempts = 0;
    }
  };
};
