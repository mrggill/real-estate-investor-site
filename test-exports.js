// test-exports.js
import * as scraper from './scripts/CombinedNewsScraper.mjs';
console.log('Available exports:', Object.keys(scraper));
console.log('Default export:', scraper.default);