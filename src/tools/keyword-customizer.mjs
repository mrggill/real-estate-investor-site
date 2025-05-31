// src/tools/keyword-customizer.mjs
import 'dotenv/config';
import fs from 'fs/promises';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import logger from '../scrapers/utils/logger.mjs';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
 * Main function to customize keywords
 */
const customizeKeywords = async () => {
    try {
      // Initialize
      await logger.init();
      logger.section("KEYWORD CUSTOMIZATION TOOL");
      
      // Path to relevance-checker.mjs file
      const relevanceCheckerPath = './src/scrapers/modules/relevance-checker.mjs';
      
      // Read the file
      const fileContent = await fs.readFile(relevanceCheckerPath, 'utf8');
      
      // Extract the jobKeywords array
      const keywordsMatch = fileContent.match(/const jobKeywords = \[([\s\S]*?)\];/);
      
      if (!keywordsMatch) {
        logger.error("Could not find jobKeywords array in relevance-checker.mjs");
        rl.close();
        return;
      }
      
      // Parse the keywords
      const keywordsString = keywordsMatch[1];
      const keywordsList = keywordsString
        .split(',')
        .map(line => {
          // Extract the keyword from the line, removing quotes and trimming
          const matches = line.match(/'([^']+)'/) || line.match(/"([^"]+)"/);
          return matches ? matches[1].trim() : null;
        })
        .filter(Boolean); // Remove null values
      
      logger.info(`Found ${keywordsList.length} keywords in relevance-checker.mjs`);
      
      // Display the menu
      console.log("\nKEYWORD CUSTOMIZATION OPTIONS:");
      console.log("1. View current keywords");
      console.log("2. Add new keywords");
      console.log("3. Remove keywords");
      console.log("4. Customize keyword categories");
      console.log("5. Export keywords to file");
      console.log("6. Import keywords from file");
      console.log("7. Update relevance-checker.mjs");
      console.log("8. Exit");
      
      const choice = await askQuestion("\nSelect an option (1-8): ");
      
      switch (choice) {
        case '1':
          await viewKeywords(keywordsList);
          break;
        case '2':
          await addKeywords(keywordsList, relevanceCheckerPath, fileContent, keywordsMatch);
          break;
        case '3':
          await removeKeywords(keywordsList, relevanceCheckerPath, fileContent, keywordsMatch);
          break;
        case '4':
          await customizeCategories(relevanceCheckerPath);
          break;
        case '5':
          await exportKeywords(keywordsList);
          break;
        case '6':
          await importKeywords(relevanceCheckerPath, fileContent, keywordsMatch);
          break;
        case '7':
          await updateRelevanceChecker(relevanceCheckerPath);
          break;
        case '8':
          logger.info("Exiting keyword customization tool");
          break;
        default:
          logger.warning("Invalid option selected");
          break;
      }
      
      rl.close();
    } catch (err) {
      logger.error("Error in keyword customization tool", err);
      rl.close();
    }
  };
  /**
 * View current keywords
 * @param {Array} keywordsList - List of keywords
 */
const viewKeywords = async (keywordsList) => {
    // Group keywords by categories (based on comments in the file)
    const categories = {
      'Employment and jobs': [],
      'Manufacturing and production': [],
      'Business relocation and facilities': [],
      'Distribution and logistics': [],
      'Real estate business terms': [],
      'Infrastructure and economic development': [],
      'Government funding and civic projects': [],
      'Airport and transportation terms': [],
      'Other': []
    };
    
    // Simple assignment based on common terms
    keywordsList.forEach(keyword => {
      if (['job', 'employ', 'hire', 'career', 'worker', 'staff', 'talent', 'HR'].some(term => 
      keyword.includes(term))) {
        categories['Employment and jobs'].push(keyword);
      } else if (['manufacturing', 'production', 'factory', 'industrial', 'assembly'].some(term => 
      keyword.includes(term))) {
        categories['Manufacturing and production'].push(keyword);
      } else if (['relocat', 'headquarters', 'HQ', 'campus', 'office', 'facility'].some(term => 
      keyword.includes(term))) {
        categories['Business relocation and facilities'].push(keyword);
      } else if (['distribution', 'logistics', 'warehouse', 'shipping', 'supply'].some(term => 
      keyword.includes(term))) {
        categories['Distribution and logistics'].push(keyword);
      } else if (['property', 'real estate', 'park', 'district', 'commercial'].some(term => 
      keyword.includes(term))) {
        categories['Real estate business terms'].push(keyword);
      } else if (['construction', 'build', 'development', 'expansion', 'infrastructure'].some(term => 
      keyword.includes(term))) {
        categories['Infrastructure and economic development'].push(keyword);
      } else if (['subsidy', 'grant', 'funding', 'tax', 'council', 'municipal'].some(term => 
      keyword.includes(term))) {
        categories['Government funding and civic projects'].push(keyword);
      } else if (['airport', 'terminal', 'airline', 'flight', 'gate', 'runway'].some(term => 
      keyword.includes(term))) {
        categories['Airport and transportation terms'].push(keyword);
      } else {
        categories['Other'].push(keyword);
      }
    });
    
    // Display keywords by category
    console.log("\nCURRENT KEYWORDS BY CATEGORY:");
    Object.entries(categories).forEach(([category, keywords]) => {
      if (keywords.length > 0) {
        console.log(`\n${category} (${keywords.length}):`);
        keywords.forEach(keyword => {
          console.log(` - ${keyword}`);
        });
      }
    });
    
    // Wait for user to continue
    await askQuestion("\nPress Enter to continue...");
  };
  /**
 * Add new keywords
 * @param {Array} keywordsList - List of keywords
 * @param {string} relevanceCheckerPath - Path to relevance-checker.mjs
 * @param {string} fileContent - Content of relevance-checker.mjs
 * @param {Array} keywordsMatch - Match result for keywords array
 */
const addKeywords = async (keywordsList, relevanceCheckerPath, fileContent, keywordsMatch) => {
    console.log("\nADD NEW KEYWORDS");
    console.log("Enter keywords one per line. Leave empty to finish.");
    
    const newKeywords = [];
    let keyword;
    let index = 1;
    
    do {
      keyword = await askQuestion(`Keyword ${index}: `);
      if (keyword && keyword.trim() !== '') {
        if (keywordsList.includes(keyword)) {
          logger.warning(`Keyword "${keyword}" already exists`);
        } else {
          newKeywords.push(keyword);
          index++;
        }
      }
    } while (keyword && keyword.trim() !== '');
    
    if (newKeywords.length === 0) {
      logger.info("No new keywords added");
      return;
    }
    
    // Add keywords to the list
    keywordsList.push(...newKeywords);
    
    // Format the new keywords array
    const formattedKeywords = keywordsList
      .map(kw => ` '${kw}'`)
      .join(',\n');
    
    // Replace the keywords in the file
    const newFileContent = fileContent.replace(
      keywordsMatch[0],
      `const jobKeywords = [\n${formattedKeywords}\n];`
    );
    
    // Write the file
    await fs.writeFile(relevanceCheckerPath, newFileContent);
    
    logger.success(`Added ${newKeywords.length} new keywords to relevance-checker.mjs`);
  };
  /**
 * Remove keywords
 * @param {Array} keywordsList - List of keywords
 * @param {string} relevanceCheckerPath - Path to relevance-checker.mjs
 * @param {string} fileContent - Content of relevance-checker.mjs
 * @param {Array} keywordsMatch - Match result for keywords array
 */
const removeKeywords = async (keywordsList, relevanceCheckerPath, fileContent, keywordsMatch) => {
    console.log("\nREMOVE KEYWORDS");
    
    // Display keywords with numbers
    console.log("\nCurrent keywords:");
    keywordsList.forEach((keyword, index) => {
      console.log(`${index + 1}. ${keyword}`);
    });
    
    const response = await askQuestion("\nEnter numbers of keywords to remove (comma separated, e.g. 1,3,5): ");
    
    if (!response || response.trim() === '') {
      logger.info("No keywords removed");
      return;
    }
    
    // Parse the numbers
    const indexesToRemove = response
      .split(',')
      .map(num => parseInt(num.trim()) - 1)
      .filter(index => !isNaN(index) && index >= 0 && index < keywordsList.length);
    
    if (indexesToRemove.length === 0) {
      logger.warning("No valid keyword numbers provided");
      return;
    }
    
    // Get the keywords to remove
    const keywordsToRemove = indexesToRemove.map(index => keywordsList[index]);
    
    // Remove the keywords
    const updatedKeywords = keywordsList.filter((_, index) => !indexesToRemove.includes(index));
    
    // Format the updated keywords array
    const formattedKeywords = updatedKeywords
      .map(kw => ` '${kw}'`)
      .join(',\n');
    
    // Replace the keywords in the file
    const newFileContent = fileContent.replace(
      keywordsMatch[0],
      `const jobKeywords = [\n${formattedKeywords}\n];`
    );
    
    // Write the file
    await fs.writeFile(relevanceCheckerPath, newFileContent);
    
    logger.success(`Removed ${keywordsToRemove.length} keywords: ${keywordsToRemove.join(', ')}`);
  };
  /**
 * Customize keyword categories
 * @param {string} relevanceCheckerPath - Path to relevance-checker.mjs
 */
const customizeCategories = async (relevanceCheckerPath) => {
    console.log("\nCUSTOMIZE KEYWORD CATEGORIES");
    console.log("This will guide you through customizing the keyword categories in relevance-checker.mjs");
    
    const fileContent = await fs.readFile(relevanceCheckerPath, 'utf8');
    
    // Define the default categories
    const defaultCategories = [
      'Employment and jobs',
      'Manufacturing and production',
      'Business relocation and facilities',
      'Distribution and logistics',
      'Real estate business terms',
      'Infrastructure and economic development',
      'Government funding and civic projects',
      'Airport and transportation terms'
    ];
    
    // Extract current categories from the file
    const categoryMatches = fileContent.match(/\/\/ (.+?)\n/g) || [];
    const currentCategories = categoryMatches
      .map(match => match.replace(/\/\/ /, '').trim())
      .filter(cat => cat.length > 0 && !cat.startsWith('(') && !cat.startsWith('...'));
    
    console.log("\nCurrent categories:");
    currentCategories.forEach((category, index) => {
      console.log(`${index + 1}. ${category}`);
    });
    
    const choice = await askQuestion("\nDo you want to add a new category (a), edit an existing one (e), or return (r)? ");
    
    if (choice.toLowerCase() === 'a') {
      // Add a new category
      const newCategory = await askQuestion("Enter the name of the new category: ");
      if (!newCategory || newCategory.trim() === '') {
        logger.warning("Category name is empty");
        return;
      }
      
      // Add keywords for the new category
      const keywords = [];
      console.log("\nEnter keywords for this category, one per line. Leave empty to finish.");
      let keyword;
      let index = 1;
      
      do {
        keyword = await askQuestion(`Keyword ${index}: `);
        if (keyword && keyword.trim() !== '') {
          keywords.push(keyword);
          index++;
        }
      } while (keyword && keyword.trim() !== '');
      
      if (keywords.length === 0) {
        logger.warning("No keywords added for the category");
        return;
      }
      
      // Format the new category
      const formattedCategory = `\n // ${newCategory}\n${keywords.map(kw => ` '${kw}',`).join('\n')}`;
      
      // Add it to the file before the end of the array
      const modifiedContent = fileContent.replace(
        /(\n];)/,
        `${formattedCategory}\n$1`
      );
      
      await fs.writeFile(relevanceCheckerPath, modifiedContent);
      
      logger.success(`Added new category "${newCategory}" with ${keywords.length} keywords`);
    } else if (choice.toLowerCase() === 'e') {
      // Edit an existing category
      const categoryIndex = await askQuestion("Enter the number of the category to edit: ");
      const index = parseInt(categoryIndex.trim()) - 1;
      
      if (isNaN(index) || index < 0 || index >= currentCategories.length) {
        logger.warning("Invalid category number");
        return;
      }
      
      const category = currentCategories[index];
      const newName = await askQuestion(`Enter new name for "${category}" (leave empty to keep current): `);
      
      if (newName && newName.trim() !== '') {
        // Replace the category name in the file
        const newContent = fileContent.replace(
          new RegExp(`\\/\\/ ${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'),
          `// ${newName}`
        );
        
        await fs.writeFile(relevanceCheckerPath, newContent);
        
        logger.success(`Changed category name from "${category}" to "${newName}"`);
      } else {
        logger.info("Category name not changed");
      }
    } else {
      logger.info("Returning to main menu");
    }
  };
  /**
 * Export keywords to a file
 * @param {Array} keywordsList - List of keywords
 */
const exportKeywords = async (keywordsList) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportFile = `./feedback/keywords-${timestamp}.txt`;
    
    // Create the feedback directory if it doesn't exist
    try {
      await fs.mkdir('./feedback', { recursive: true });
    } catch (err) {
      // Ignore
    }
    
    // Write the keywords to the file
    await fs.writeFile(exportFile, keywordsList.join('\n'));
    
    logger.success(`Exported ${keywordsList.length} keywords to ${exportFile}`);
  };
  
  /**
   * Import keywords from a file
   * @param {string} relevanceCheckerPath - Path to relevance-checker.mjs
   * @param {string} fileContent - Content of relevance-checker.mjs
   * @param {Array} keywordsMatch - Match result for keywords array
   */
  const importKeywords = async (relevanceCheckerPath, fileContent, keywordsMatch) => {
    const importFile = await askQuestion("\nEnter path to keywords file: ");
    
    if (!importFile || importFile.trim() === '') {
      logger.warning("No file path provided");
      return;
    }
    
    try {
      // Read the file
      const importedData = await fs.readFile(importFile, 'utf8');
      
      // Parse the keywords
      const importedKeywords = importedData
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && line !== '');
      
      if (importedKeywords.length === 0) {
        logger.warning("No keywords found in the file");
        return;
      }
      
      // Format the keywords
      const formattedKeywords = importedKeywords
        .map(kw => ` '${kw}'`)
        .join(',\n');
      
      // Replace the keywords in the file
      const newFileContent = fileContent.replace(
        keywordsMatch[0],
        `const jobKeywords = [\n${formattedKeywords}\n];`
      );
      
      // Write the file
      await fs.writeFile(relevanceCheckerPath, newFileContent);
      
      logger.success(`Imported ${importedKeywords.length} keywords from ${importFile}`);
    } catch (err) {
      logger.error(`Error importing keywords: ${err.message}`);
    }
  };
  /**
 * Update the relevance-checker.mjs file
 * @param {string} relevanceCheckerPath - Path to relevance-checker.mjs
 */
const updateRelevanceChecker = async (relevanceCheckerPath) => {
    console.log("\nUPDATE RELEVANCE CHECKER");
    console.log("This will allow you to modify the relevance checking logic.");
    
    const options = [
      "Edit critical keywords",
      "Edit dollar amount detection",
      "Edit funding phrases",
      "Edit special case logic",
      "Return to main menu"
    ];
    
    console.log("\nOptions:");
    options.forEach((option, index) => {
      console.log(`${index + 1}. ${option}`);
    });
    
    const choice = await askQuestion("\nSelect an option (1-5): ");
    
    if (choice === '5' || choice === '') {
      logger.info("Returning to main menu");
      return;
    }
    
    const fileContent = await fs.readFile(relevanceCheckerPath, 'utf8');
    
    switch (choice) {
      case '1':
        // Edit critical keywords
        await editCriticalKeywords(relevanceCheckerPath, fileContent);
        break;
      case '2':
        // Edit dollar amount detection
        await editDollarAmountDetection(relevanceCheckerPath, fileContent);
        break;
      case '3':
        // Edit funding phrases
        await editFundingPhrases(relevanceCheckerPath, fileContent);
        break;
      case '4':
        // Edit special case logic
        await editSpecialCases(relevanceCheckerPath, fileContent);
        break;
      default:
        logger.warning("Invalid option selected");
        break;
    }
  };
  /**
 * Edit critical keywords
 * @param {string} relevanceCheckerPath - Path to relevance-checker.mjs
 * @param {string} fileContent - Content of relevance-checker.mjs
 */
const editCriticalKeywords = async (relevanceCheckerPath, fileContent) => {
    // Extract the critical keywords
    const criticalKeywordsMatch = fileContent.match(/const criticalKeywords = \[([\s\S]*?)\];/);
    
    if (!criticalKeywordsMatch) {
      logger.error("Could not find criticalKeywords array in relevance-checker.mjs");
      return;
    }
    
    // Parse the keywords
    const keywordsString = criticalKeywordsMatch[1];
    const keywordsList = keywordsString
      .split(',')
      .map(line => {
        // Extract the keyword from the line, removing quotes and trimming
        const matches = line.match(/'([^']+)'/) || line.match(/"([^"]+)"/);
        return matches ? matches[1].trim() : null;
      })
      .filter(Boolean); // Remove null values
    
    console.log("\nCurrent critical keywords:");
    keywordsList.forEach((keyword, index) => {
      console.log(`${index + 1}. ${keyword}`);
    });
    
    console.log("\nOptions:");
    console.log("1. Add critical keywords");
    console.log("2. Remove critical keywords");
    console.log("3. Return to previous menu");
    
    const choice = await askQuestion("\nSelect an option (1-3): ");
    
    if (choice === '3' || choice === '') {
      return;
    }
    
    if (choice === '1') {
      // Add critical keywords
      console.log("\nADD CRITICAL KEYWORDS");
      console.log("Enter keywords one per line. Leave empty to finish.");
      
      const newKeywords = [];
      let keyword;
      let index = 1;
      
      do {
        keyword = await askQuestion(`Keyword ${index}: `);
        if (keyword && keyword.trim() !== '') {
          if (keywordsList.includes(keyword)) {
            logger.warning(`Keyword "${keyword}" already exists`);
          } else {
            newKeywords.push(keyword);
            index++;
          }
        }
      } while (keyword && keyword.trim() !== '');
      
      if (newKeywords.length === 0) {
        logger.info("No new keywords added");
        return;
      }
      
      // Add keywords to the list
      keywordsList.push(...newKeywords);
      
      // Format the new keywords array
      const formattedKeywords = keywordsList
        .map(kw => ` '${kw}'`)
        .join(',\n');
      
      // Replace the keywords in the file
      const newFileContent = fileContent.replace(
        criticalKeywordsMatch[0],
        `const criticalKeywords = [\n${formattedKeywords}\n ];`
      );
      
      // Write the file
      await fs.writeFile(relevanceCheckerPath, newFileContent);
      
      logger.success(`Added ${newKeywords.length} new critical keywords`);
    } else if (choice === '2') {
      // Remove critical keywords
      console.log("\nREMOVE CRITICAL KEYWORDS");
      
      const response = await askQuestion("\nEnter numbers of keywords to remove (comma separated, e.g. 1,3,5): ");
      
      if (!response || response.trim() === '') {
        logger.info("No keywords removed");
        return;
      }
      
      // Parse the numbers
      const indexesToRemove = response
        .split(',')
        .map(num => parseInt(num.trim()) - 1)
        .filter(index => !isNaN(index) && index >= 0 && index < keywordsList.length);
      
      if (indexesToRemove.length === 0) {
        logger.warning("No valid keyword numbers provided");
        return;
      }
      
      // Get the keywords to remove
      const keywordsToRemove = indexesToRemove.map(index => keywordsList[index]);
      
      // Remove the keywords
      const updatedKeywords = keywordsList.filter((_, index) => !indexesToRemove.includes(index));
      
      // Format the updated keywords array
      const formattedKeywords = updatedKeywords
        .map(kw => ` '${kw}'`)
        .join(',\n');
      
      // Replace the keywords in the file
      const newFileContent = fileContent.replace(
        criticalKeywordsMatch[0],
        `const criticalKeywords = [\n${formattedKeywords}\n ];`
      );
      
      // Write the file
      await fs.writeFile(relevanceCheckerPath, newFileContent);
      
      logger.success(`Removed ${keywordsToRemove.length} critical keywords: ${keywordsToRemove.join(', ')}`);
    }
  };
  
  /**
   * Edit dollar amount detection
   * @param {string} relevanceCheckerPath - Path to relevance-checker.mjs
   * @param {string} fileContent - Content of relevance-checker.mjs
   */
  const editDollarAmountDetection = async (relevanceCheckerPath, fileContent) => {
    // Extract the dollar regex
    const dollarRegexMatch = fileContent.match(/const dollarRegex = \/(.*?)\/([a-z]*);/);
    
    if (!dollarRegexMatch) {
      logger.error("Could not find dollarRegex in relevance-checker.mjs");
      return;
    }
    
    const currentRegex = dollarRegexMatch[0];
    
    console.log("\nCurrent dollar amount detection regex:");
    console.log(currentRegex);
    
    const newRegex = await askQuestion("\nEnter new regex (leave empty to keep current): ");
    
    if (!newRegex || newRegex.trim() === '') {
      logger.info("Dollar regex not changed");
      return;
    }
    
    try {
      // Test if the new regex is valid
      new RegExp(newRegex);
      
      // Replace the regex in the file
      const fullRegex = `const dollarRegex = /${newRegex}/i;`;
      const newFileContent = fileContent.replace(currentRegex, fullRegex);
      
      // Write the file
      await fs.writeFile(relevanceCheckerPath, newFileContent);
      
      logger.success(`Updated dollar amount detection regex to: ${fullRegex}`);
    } catch (err) {
      logger.error(`Invalid regex: ${err.message}`);
    }
  };
  /**
 * Edit funding phrases
 * @param {string} relevanceCheckerPath - Path to relevance-checker.mjs
 * @param {string} fileContent - Content of relevance-checker.mjs
 */
const editFundingPhrases = async (relevanceCheckerPath, fileContent) => {
    // Extract the funding phrases
    const fundingPhrasesMatch = fileContent.match(/const fundingPhrases = \[([\s\S]*?)\];/);
    
    if (!fundingPhrasesMatch) {
      logger.error("Could not find fundingPhrases array in relevance-checker.mjs");
      return;
    }
    
    // Parse the phrases
    const phrasesString = fundingPhrasesMatch[1];
    const phrasesList = phrasesString
      .split(',')
      .map(line => {
        // Extract the phrase from the line, removing quotes and trimming
        const matches = line.match(/'([^']+)'/) || line.match(/"([^"]+)"/);
        return matches ? matches[1].trim() : null;
      })
      .filter(Boolean); // Remove null values
    
    console.log("\nCurrent funding phrases:");
    phrasesList.forEach((phrase, index) => {
      console.log(`${index + 1}. ${phrase}`);
    });
    
    console.log("\nOptions:");
    console.log("1. Add funding phrases");
    console.log("2. Remove funding phrases");
    console.log("3. Return to previous menu");
    
    const choice = await askQuestion("\nSelect an option (1-3): ");
    
    if (choice === '3' || choice === '') {
      return;
    }
    
    if (choice === '1') {
      // Add funding phrases
      console.log("\nADD FUNDING PHRASES");
      console.log("Enter phrases one per line. Leave empty to finish.");
      
      const newPhrases = [];
      let phrase;
      let index = 1;
      
      do {
        phrase = await askQuestion(`Phrase ${index}: `);
        if (phrase && phrase.trim() !== '') {
          if (phrasesList.includes(phrase)) {
            logger.warning(`Phrase "${phrase}" already exists`);
          } else {
            newPhrases.push(phrase);
            index++;
          }
        }
      } while (phrase && phrase.trim() !== '');
      
      if (newPhrases.length === 0) {
        logger.info("No new phrases added");
        return;
      }
      
      // Add phrases to the list
      phrasesList.push(...newPhrases);
      
      // Format the new phrases array
      const formattedPhrases = phrasesList
        .map(ph => ` '${ph}'`)
        .join(',\n');
      
      // Replace the phrases in the file
      const newFileContent = fileContent.replace(
        fundingPhrasesMatch[0],
        `const fundingPhrases = [\n${formattedPhrases}\n ];`
      );
      
      // Write the file
      await fs.writeFile(relevanceCheckerPath, newFileContent);
      
      logger.success(`Added ${newPhrases.length} new funding phrases`);
    } else if (choice === '2') {
      // Remove funding phrases
      console.log("\nREMOVE FUNDING PHRASES");
      
      const response = await askQuestion("\nEnter numbers of phrases to remove (comma separated, e.g. 1,3,5): ");
      
      if (!response || response.trim() === '') {
        logger.info("No phrases removed");
        return;
      }
      
      // Parse the numbers
      const indexesToRemove = response
        .split(',')
        .map(num => parseInt(num.trim()) - 1)
        .filter(index => !isNaN(index) && index >= 0 && index < phrasesList.length);
      
      if (indexesToRemove.length === 0) {
        logger.warning("No valid phrase numbers provided");
        return;
      }
      
      // Get the phrases to remove
      const phrasesToRemove = indexesToRemove.map(index => phrasesList[index]);
      
      // Remove the phrases
      const updatedPhrases = phrasesList.filter((_, index) => !indexesToRemove.includes(index));
      
      // Format the updated phrases array
      const formattedPhrases = updatedPhrases
        .map(ph => ` '${ph}'`)
        .join(',\n');
      
      // Replace the phrases in the file
      const newFileContent = fileContent.replace(
        fundingPhrasesMatch[0],
        `const fundingPhrases = [\n${formattedPhrases}\n ];`
      );
      
      // Write the file
      await fs.writeFile(relevanceCheckerPath, newFileContent);
      
      logger.success(`Removed ${phrasesToRemove.length} funding phrases: ${phrasesToRemove.join(', ')}`);
    }
};
      /**
 * Edit special cases
 * @param {string} relevanceCheckerPath - Path to relevance-checker.mjs
 * @param {string} fileContent - Content of relevance-checker.mjs
 */
const editSpecialCases = async (relevanceCheckerPath, fileContent) => {
    console.log("\nEDIT SPECIAL CASES");
    console.log("This feature allows you to edit the special case logic for relevance detection.");
    console.log("Note: This is advanced functionality that requires modifying code.");
    
    const shouldContinue = await askQuestion("\nDo you want to continue? (y/n): ");
    
    if (shouldContinue.toLowerCase() !== 'y') {
      return;
    }
    
    // Special cases logic blocks - these are the if/else checks for specific patterns
    console.log("\nSpecial cases in relevance-checker.mjs:");
    console.log("1. City Council / Government Approvals");
    console.log("2. Dollar Amount Detection");
    console.log("3. Industrial Park / Business Center");
    console.log("4. Manufacturing / Production Facility");
    console.log("5. Job Creation / Employment Keywords");
    console.log("6. Return to previous menu");
    
    const choice = await askQuestion("\nSelect a special case to edit (1-6): ");
    
    if (choice === '6' || choice === '') {
      return;
    }
    
    // Define regex patterns to find each special case block
    const specialCasePatterns = [
      // City Council / Government Approvals
      /\/\/ Check for city council or government approvals[\s\S]*?(?=\/\/ Check for|$)/,
      // Dollar Amount Detection
      /\/\/ Check for dollar amounts[\s\S]*?(?=\/\/ Check for|$)/,
      // Industrial Park / Business Center
      /\/\/ Check for industrial park or business center[\s\S]*?(?=\/\/ Check for|$)/,
      // Manufacturing / Production Facility
      /\/\/ Check for manufacturing or production facility[\s\S]*?(?=\/\/ Check for|$)/,
      // Job Creation / Employment Keywords
      /\/\/ Check for job creation or employment keywords[\s\S]*?(?=\/\/ Check for|$)/
    ];
    
    if (parseInt(choice) < 1 || parseInt(choice) > 5) {
      logger.warning("Invalid option selected");
      return;
    }
    
    const selectedPattern = specialCasePatterns[parseInt(choice) - 1];
    const match = fileContent.match(selectedPattern);
    
    if (!match) {
      logger.error("Could not find the selected special case logic in the file");
      return;
    }
    
    console.log("\nCurrent logic for this special case:");
    console.log(match[0]);
    
    console.log("\nYou can now edit this logic. Be careful to maintain the correct JavaScript syntax.");
    console.log("Leave empty to cancel edit.");
    
    const newLogic = await askQuestion("\nEnter new logic (or press Enter to cancel):\n");
    
    if (!newLogic || newLogic.trim() === '') {
      logger.info("Edit cancelled");
      return;
    }
    
    try {
      // Replace the logic in the file
      const newFileContent = fileContent.replace(match[0], newLogic);
      
      // Write the file
      await fs.writeFile(relevanceCheckerPath, newFileContent);
      
      logger.success("Updated special case logic");
    } catch (err) {
      logger.error(`Error updating special case logic: ${err.message}`);
    }
  };
  /**
 * Main menu for Model Trainer Tool
 */
const mainMenu = async () => {
    try {
      await logger.init();
      
      console.log("\n=== MODEL TRAINER TOOL ===");
      console.log("1. Keyword Customizer");
      console.log("2. Training Data Manager");
      console.log("3. Model Testing & Training");
      console.log("4. Exit");
      
      const choice = await askQuestion("\nSelect an option (1-4): ");
      
      switch (choice) {
        case '1':
          await customizeKeywords();
          break;
        case '2':
          await trainingDataManager();
          break;
        case '3':
          await modelTrainer();
          break;
        case '4':
          console.log("Exiting Model Trainer Tool");
          break;
        default:
          console.log("Invalid option selected");
          break;
      }
    } catch (err) {
      console.error("Error in model trainer tool:", err);
    } finally {
      rl.close();
      process.exit(0);
    }
  };
  
  /**
   * Forward declaration of imported functions from other modules
   * These will be imported at runtime when needed
   */
  let trainingDataManager;
  let modelTrainer;
  
  /**
   * Dynamic import of the training data manager and model trainer modules
   */
  const importModules = async () => {
    try {
      // Dynamic import of training data manager
      const trainingDataManagerModule = await import('./training-data-manager.mjs');
      trainingDataManager = trainingDataManagerModule.trainingDataManager;
      
      // Dynamic import of model trainer
      const modelTrainerModule = await import('./model-trainer.mjs');
      modelTrainer = modelTrainerModule.modelTrainer;
      
      return true;
    } catch (err) {
      console.error(`Error importing modules: ${err.message}`);
      console.log("Some features may not be available. Make sure training-data-manager.mjs and model-trainer.mjs exist.");
      return false;
    }
  };// Run the tool when executed directly
  if (import.meta.url === `file://${process.argv[1]}`) {
    // Try to import modules first, then run main menu
    importModules()
      .then(() => mainMenu())
      .catch(err => {
        console.error("Error in model trainer tool:", err);
        process.exit(1);
      });
  }
  
  // Individual exports
    export const functionExports = {
    customizeKeywords,
    viewKeywords,
    addKeywords,
    removeKeywords,
    customizeCategories,
    exportKeywords,
    importKeywords,
    updateRelevanceChecker,
    editCriticalKeywords,
    editDollarAmountDetection,
    editFundingPhrases,
    editSpecialCases,
    mainMenu
  };
  
  // Run the tool when executed directly
  if (import.meta.url === `file://${process.argv[1]}`) {
    // Try to import modules first, then run main menu
    importModules()
      .then(() => mainMenu())
      .catch(err => {
        console.error("Error in model trainer tool:", err);
        process.exit(1);
      });
  }