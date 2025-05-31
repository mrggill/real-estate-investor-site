// src/check-imports.mjs
import fs from 'fs/promises';
import path from 'path';

async function checkFile(filePath) {
  try {
    console.log(`\nChecking ${filePath}:`);
    const content = await fs.readFile(filePath, 'utf8');
    
    // Find import statements
    const importLines = content.split('\n')
      .filter(line => line.trim().startsWith('import ') && line.includes('from '));
    
    for (const line of importLines) {
      console.log(`  ${line.trim()}`);
    }
    
    // Check export statements
    const exportLines = content.split('\n')
      .filter(line => line.trim().startsWith('export '));
    
    for (const line of exportLines) {
      console.log(`  ${line.trim()}`);
    }
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
  }
}

async function main() {
  // Check specific files
  await checkFile('./src/scrapers/modules/article-processor.mjs');
  await checkFile('./src/scrapers/modules/relevance-checker.mjs');
  await checkFile('./src/scrapers/modules/page-scraper.mjs');
}

main();