// src/tools/training-data-manager.mjs

import 'dotenv/config';
import fs from 'fs/promises';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import logger from '../scrapers/utils/logger.mjs';
import natural from 'natural'; // You'll need to npm install natural

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define paths
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const TRAINING_DIR = path.join(DATA_DIR, 'training');
const RELEVANT_DIR = path.join(TRAINING_DIR, 'relevant');
const IRRELEVANT_DIR = path.join(TRAINING_DIR, 'irrelevant');
const FEATURES_FILE = path.join(TRAINING_DIR, 'features.json');
const MODELS_DIR = path.join(DATA_DIR, 'models');

// Initialize NLP tools
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;
const TfIdf = natural.TfIdf;
const tfidf = new TfIdf();

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
 * Initialize the training data directories
 */
const initializeDirectories = async () => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(TRAINING_DIR, { recursive: true });
    await fs.mkdir(RELEVANT_DIR, { recursive: true });
    await fs.mkdir(IRRELEVANT_DIR, { recursive: true });
    await fs.mkdir(MODELS_DIR, { recursive: true });
    
    // Initialize features file if it doesn't exist
    try {
      await fs.access(FEATURES_FILE);
    } catch (err) {
      await fs.writeFile(FEATURES_FILE, JSON.stringify({
        wordFrequencies: {},
        relevantKeywords: [],
        irrelevantKeywords: [],
        stats: {
          totalRelevant: 0,
          totalIrrelevant: 0,
          lastUpdated: new Date().toISOString()
        }
      }));
    }
    
    logger.success("Training data directories initialized");
  } catch (err) {
    logger.error("Error initializing directories", err);
    throw err;
  }
};

/**
 * Main function for Training Data Manager
 */
const trainingDataManager = async () => {
  try {
    await initializeDirectories();
    await logger.init();
    logger.section("TRAINING DATA MANAGER");
    
    // Display the menu
    console.log("\nTRAINING DATA MANAGEMENT OPTIONS:");
    console.log("1. Import articles for labeling");
    console.log("2. Label articles (relevant/irrelevant)");
    console.log("3. View dataset statistics");
    console.log("4. Generate features from labeled data");
    console.log("5. Export training dataset");
    console.log("6. Clean/manage training data");
    console.log("7. Return to main menu");
    
    const choice = await askQuestion("\nSelect an option (1-7): ");
    
    switch (choice) {
      case '1':
        await importArticles();
        break;
      case '2':
        await labelArticles();
        break;
      case '3':
        await viewDatasetStats();
        break;
      case '4':
        await generateFeatures();
        break;
      case '5':
        await exportTrainingData();
        break;
      case '6':
        await manageTrainingData();
        break;
      case '7':
        logger.info("Returning to main menu");
        rl.close();
        return;
      default:
        logger.warning("Invalid option selected");
        break;
    }
    
    rl.close();
  } catch (err) {
    logger.error("Error in Training Data Manager", err);
    rl.close();
  }
};

/**
 * Import articles for labeling
 */
const importArticles = async () => {
  try {
    const sourcePath = await askQuestion("\nEnter path to scraped articles directory: ");
    
    if (!sourcePath || sourcePath.trim() === '') {
      logger.warning("No source path provided");
      return;
    }
    
    // Read all JSON files from the source directory
    const files = await fs.readdir(sourcePath);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    if (jsonFiles.length === 0) {
      logger.warning("No JSON files found in the specified directory");
      return;
    }
    
    logger.info(`Found ${jsonFiles.length} articles to import`);
    
    // Create an "unlabeled" directory if it doesn't exist
    const unlabeledDir = path.join(TRAINING_DIR, 'unlabeled');
    await fs.mkdir(unlabeledDir, { recursive: true });
    
    // Copy files to unlabeled directory
    let importCount = 0;
    for (const file of jsonFiles) {
      const sourceFull = path.join(sourcePath, file);
      const destFull = path.join(unlabeledDir, file);
      
      try {
        await fs.copyFile(sourceFull, destFull);
        importCount++;
      } catch (err) {
        logger.error(`Error copying file ${file}`, err);
      }
    }
    
    logger.success(`Successfully imported ${importCount} articles for labeling`);
  } catch (err) {
    logger.error("Error importing articles", err);
  }
};

/**
 * Label articles as relevant or irrelevant
 */
const labelArticles = async () => {
  try {
    // Check for unlabeled articles
    const unlabeledDir = path.join(TRAINING_DIR, 'unlabeled');
    await fs.mkdir(unlabeledDir, { recursive: true });
    
    const files = await fs.readdir(unlabeledDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    if (jsonFiles.length === 0) {
      logger.warning("No unlabeled articles found. Import articles first.");
      return;
    }
    
    logger.info(`Found ${jsonFiles.length} unlabeled articles`);
    console.log("\nLet's start labeling articles:");
    
    // Load features data
    let features = JSON.parse(await fs.readFile(FEATURES_FILE, 'utf8'));
    
    for (const file of jsonFiles) {
      const filePath = path.join(unlabeledDir, file);
      
      try {
        // Load and display article
        const articleData = JSON.parse(await fs.readFile(filePath, 'utf8'));
        
        console.log("\n" + "=".repeat(50));
        console.log(`TITLE: ${articleData.title || 'No title'}`);
        console.log("-".repeat(50));
        
        // Display a snippet of the content
        const content = articleData.content || articleData.text || 'No content';
        console.log(`SNIPPET: ${content.substring(0, 200)}...`);
        console.log("-".repeat(50));
        
        // Get user decision
        const decision = await askQuestion("Is this article relevant? (y/n/s/q - yes/no/skip/quit): ");
        
        if (decision.toLowerCase() === 'q') {
          logger.info("Quitting labeling session");
          break;
        }
        
        if (decision.toLowerCase() === 's') {
          logger.info(`Skipping article: ${file}`);
          continue;
        }
        
        // Move the file to the appropriate directory
        let targetDir;
        if (decision.toLowerCase() === 'y') {
          targetDir = RELEVANT_DIR;
          features.stats.totalRelevant++;
          
          // Process article for relevant keywords (basic implementation)
          const tokens = tokenizer.tokenize(content.toLowerCase());
          const stemmed = tokens.map(token => stemmer.stem(token));
          
          // Update word frequencies
          stemmed.forEach(word => {
            if (!features.wordFrequencies[word]) {
              features.wordFrequencies[word] = { relevant: 0, irrelevant: 0 };
            }
            features.wordFrequencies[word].relevant++;
          });
        } else {
          targetDir = IRRELEVANT_DIR;
          features.stats.totalIrrelevant++;
          
          // Process article for irrelevant keywords
          const tokens = tokenizer.tokenize(content.toLowerCase());
          const stemmed = tokens.map(token => stemmer.stem(token));
          
          // Update word frequencies
          stemmed.forEach(word => {
            if (!features.wordFrequencies[word]) {
              features.wordFrequencies[word] = { relevant: 0, irrelevant: 0 };
            }
            features.wordFrequencies[word].irrelevant++;
          });
        }
        
        // Move the file
        const targetPath = path.join(targetDir, file);
        await fs.rename(filePath, targetPath);
        
        logger.success(`Labeled article as ${decision.toLowerCase() === 'y' ? 'relevant' : 'irrelevant'}: ${file}`);
      } catch (err) {
        logger.error(`Error processing file ${file}`, err);
      }
    }
    
    // Update features file
    features.stats.lastUpdated = new Date().toISOString();
    await fs.writeFile(FEATURES_FILE, JSON.stringify(features, null, 2));
    
    logger.success("Labeling session completed. Features updated.");
  } catch (err) {
    logger.error("Error labeling articles", err);
  }
};

/**
 * View dataset statistics
 */
const viewDatasetStats = async () => {
  try {
    // Read feature data
    const features = JSON.parse(await fs.readFile(FEATURES_FILE, 'utf8'));
    
    // Count files in relevant and irrelevant directories
    const relevantFiles = await fs.readdir(RELEVANT_DIR);
    const irrelevantFiles = await fs.readdir(IRRELEVANT_DIR);
    const unlabeledFiles = await fs.readdir(path.join(TRAINING_DIR, 'unlabeled'));
    
    console.log("\nDATASET STATISTICS:");
    console.log("-".repeat(50));
    console.log(`Total Relevant Articles: ${relevantFiles.length}`);
    console.log(`Total Irrelevant Articles: ${irrelevantFiles.length}`);
    console.log(`Unlabeled Articles: ${unlabeledFiles.length}`);
    console.log(`Total Dataset Size: ${relevantFiles.length + irrelevantFiles.length}`);
    console.log(`Dataset Balance: ${((relevantFiles.length / (relevantFiles.length + irrelevantFiles.length)) * 100).toFixed(2)}% relevant`);
    console.log(`Last Updated: ${features.stats.lastUpdated}`);
    console.log(`Unique Words Analyzed: ${Object.keys(features.wordFrequencies).length}`);
    
    // Display most discriminative words
    console.log("\nMOST RELEVANT KEYWORDS:");
    const sortedWords = Object.entries(features.wordFrequencies)
      .filter(([word, counts]) => counts.relevant + counts.irrelevant >= 5) // Minimum occurrences
      .map(([word, counts]) => {
        const relevanceScore = counts.relevant / (counts.relevant + counts.irrelevant);
        return { word, score: relevanceScore, total: counts.relevant + counts.irrelevant };
      })
      .filter(item => item.total >= 3) // Filter out rare words
      .sort((a, b) => b.score - a.score);
    
    sortedWords.slice(0, 20).forEach((item, index) => {
      console.log(`${index + 1}. ${item.word}: ${(item.score * 100).toFixed(2)}% relevant (${item.total} occurrences)`);
    });
    
    console.log("\nLEAST RELEVANT KEYWORDS:");
    sortedWords.slice(-20).reverse().forEach((item, index) => {
      console.log(`${index + 1}. ${item.word}: ${(item.score * 100).toFixed(2)}% relevant (${item.total} occurrences)`);
    });
    
    await askQuestion("\nPress Enter to continue...");
  } catch (err) {
    logger.error("Error viewing dataset statistics", err);
  }
};

/**
 * Generate features from labeled data
 */
const generateFeatures = async () => {
  try {
    logger.info("Generating features from labeled data...");
    
    // Read all relevant articles
    const relevantFiles = await fs.readdir(RELEVANT_DIR);
    const irrelevantFiles = await fs.readdir(IRRELEVANT_DIR);
    
    if (relevantFiles.length === 0 && irrelevantFiles.length === 0) {
      logger.warning("No labeled data found. Please label some articles first.");
      return;
    }
    
    // Initialize TF-IDF
    const tfidf = new TfIdf();
    
    // Add relevant documents
    logger.info(`Processing ${relevantFiles.length} relevant articles...`);
    for (const file of relevantFiles) {
      try {
        const filePath = path.join(RELEVANT_DIR, file);
        const articleData = JSON.parse(await fs.readFile(filePath, 'utf8'));
        const content = articleData.content || articleData.text || '';
        tfidf.addDocument(content);
      } catch (err) {
        logger.error(`Error processing relevant file ${file}`, err);
      }
    }
    
    // Extract most significant terms from relevant documents
    const relevantKeywords = new Set();
    for (let i = 0; i < tfidf.documents.length; i++) {
      const terms = tfidf.listTerms(i).slice(0, 50); // Get top 50 terms
      terms.forEach(term => {
        relevantKeywords.add(term.term);
      });
    }
    
    // Initialize a new TF-IDF for irrelevant documents
    const irrelevantTfidf = new TfIdf();
    
    // Add irrelevant documents
    logger.info(`Processing ${irrelevantFiles.length} irrelevant articles...`);
    for (const file of irrelevantFiles) {
      try {
        const filePath = path.join(IRRELEVANT_DIR, file);
        const articleData = JSON.parse(await fs.readFile(filePath, 'utf8'));
        const content = articleData.content || articleData.text || '';
        irrelevantTfidf.addDocument(content);
      } catch (err) {
        logger.error(`Error processing irrelevant file ${file}`, err);
      }
    }
    
    // Extract most significant terms from irrelevant documents
    const irrelevantKeywords = new Set();
    for (let i = 0; i < irrelevantTfidf.documents.length; i++) {
      const terms = irrelevantTfidf.listTerms(i).slice(0, 50); // Get top 50 terms
      terms.forEach(term => {
        irrelevantKeywords.add(term.term);
      });
    }
    
    // Create word frequency dictionary
    const wordFrequencies = {};
    
    // Process relevant documents for word frequencies
    for (const file of relevantFiles) {
      try {
        const filePath = path.join(RELEVANT_DIR, file);
        const articleData = JSON.parse(await fs.readFile(filePath, 'utf8'));
        const content = articleData.content || articleData.text || '';
        
        const tokens = tokenizer.tokenize(content.toLowerCase());
        const stemmed = tokens.map(token => stemmer.stem(token));
        
        // Count word frequencies
        stemmed.forEach(word => {
          if (!wordFrequencies[word]) {
            wordFrequencies[word] = { relevant: 0, irrelevant: 0 };
          }
          wordFrequencies[word].relevant++;
        });
      } catch (err) {
        logger.error(`Error processing file ${file} for word frequencies`, err);
      }
    }
    
    // Process irrelevant documents for word frequencies
    for (const file of irrelevantFiles) {
      try {
        const filePath = path.join(IRRELEVANT_DIR, file);
        const articleData = JSON.parse(await fs.readFile(filePath, 'utf8'));
        const content = articleData.content || articleData.text || '';
        
        const tokens = tokenizer.tokenize(content.toLowerCase());
        const stemmed = tokens.map(token => stemmer.stem(token));
        
        // Count word frequencies
        stemmed.forEach(word => {
          if (!wordFrequencies[word]) {
            wordFrequencies[word] = { relevant: 0, irrelevant: 0 };
          }
          wordFrequencies[word].irrelevant++;
        });
      } catch (err) {
        logger.error(`Error processing file ${file} for word frequencies`, err);
      }
    }
    
    // Save features to file
    const features = {
      wordFrequencies,
      relevantKeywords: Array.from(relevantKeywords),
      irrelevantKeywords: Array.from(irrelevantKeywords),
      stats: {
        totalRelevant: relevantFiles.length,
        totalIrrelevant: irrelevantFiles.length,
        lastUpdated: new Date().toISOString()
      }
    };
    
    await fs.writeFile(FEATURES_FILE, JSON.stringify(features, null, 2));
    
    logger.success("Features generated successfully!");
    console.log(`Analyzed ${relevantFiles.length + irrelevantFiles.length} articles`);
    console.log(`Extracted ${Object.keys(wordFrequencies).length} unique words`);
    console.log(`Identified ${relevantKeywords.size} relevant keywords and ${irrelevantKeywords.size} irrelevant keywords`);
    
    await askQuestion("\nPress Enter to continue...");
  } catch (err) {
    logger.error("Error generating features", err);
  }
};

/**
 * Export training dataset for model training
 */
const exportTrainingData = async () => {
  try {
    const exportPath = await askQuestion("\nEnter export directory path (or press Enter for default): ");
    const targetPath = exportPath && exportPath.trim() !== '' 
      ? exportPath 
      : path.join(DATA_DIR, 'export');
    
    // Create export directory
    await fs.mkdir(targetPath, { recursive: true });
    
    // Read all relevant and irrelevant articles
    const relevantFiles = await fs.readdir(RELEVANT_DIR);
    const irrelevantFiles = await fs.readdir(IRRELEVANT_DIR);
    
    // Create dataset object
    const dataset = {
      relevant: [],
      irrelevant: [],
      metadata: {
        exportDate: new Date().toISOString(),
        totalRelevant: relevantFiles.length,
        totalIrrelevant: irrelevantFiles.length
      }
    };
    
    // Process relevant articles
    logger.info(`Processing ${relevantFiles.length} relevant articles...`);
    for (const file of relevantFiles) {
      try {
        const filePath = path.join(RELEVANT_DIR, file);
        const articleData = JSON.parse(await fs.readFile(filePath, 'utf8'));
        
        // Extract text and relevant metadata
        dataset.relevant.push({
          id: file.replace('.json', ''),
          title: articleData.title || '',
          content: articleData.content || articleData.text || '',
          url: articleData.url || '',
          date: articleData.date || articleData.publishedDate || null
        });
      } catch (err) {
        logger.error(`Error processing relevant file ${file}`, err);
      }
    }
    
    // Process irrelevant articles
    logger.info(`Processing ${irrelevantFiles.length} irrelevant articles...`);
    for (const file of irrelevantFiles) {
      try {
        const filePath = path.join(IRRELEVANT_DIR, file);
        const articleData = JSON.parse(await fs.readFile(filePath, 'utf8'));
        
        // Extract text and relevant metadata
        dataset.irrelevant.push({
          id: file.replace('.json', ''),
          title: articleData.title || '',
          content: articleData.content || articleData.text || '',
          url: articleData.url || '',
          date: articleData.date || articleData.publishedDate || null
        });
      } catch (err) {
        logger.error(`Error processing irrelevant file ${file}`, err);
      }
    }
    
    // Save the dataset
    const exportFile = path.join(targetPath, `training-dataset-${new Date().toISOString().replace(/:/g, '-')}.json`);
    await fs.writeFile(exportFile, JSON.stringify(dataset, null, 2));
    
    // Also export features
    const features = JSON.parse(await fs.readFile(FEATURES_FILE, 'utf8'));
    const featuresFile = path.join(targetPath, `features-${new Date().toISOString().replace(/:/g, '-')}.json`);
    await fs.writeFile(featuresFile, JSON.stringify(features, null, 2));
    
    logger.success(`Dataset exported successfully to ${exportFile}`);
    logger.success(`Features exported successfully to ${featuresFile}`);
  } catch (err) {
    logger.error("Error exporting training data", err);
  }
};

/**
 * Clean and manage training data
 */
const manageTrainingData = async () => {
  try {
    console.log("\nTRAINING DATA MANAGEMENT:");
    console.log("1. Remove duplicate articles");
    console.log("2. Balance dataset (subsample majority class)");
    console.log("3. Clean all training data (WARNING: This will delete all labeled data)");
    console.log("4. Return to previous menu");
    
    const choice = await askQuestion("\nSelect an option (1-4): ");
    
    switch (choice) {
      case '1':
        await removeDuplicates();
        break;
      case '2':
        await balanceDataset();
        break;
      case '3':
        await cleanTrainingData();
        break;
      case '4':
        return;
      default:
        logger.warning("Invalid option selected");
        break;
    }
  } catch (err) {
    logger.error("Error managing training data", err);
  }
};

/**
 * Remove duplicate articles based on content similarity
 */
const removeDuplicates = async () => {
  try {
    logger.info("Looking for duplicate articles...");
    
    // Process relevant articles
    const relevantFiles = await fs.readdir(RELEVANT_DIR);
    const relevantContents = new Map();
    const relevantDuplicates = [];
    
    for (const file of relevantFiles) {
      const filePath = path.join(RELEVANT_DIR, file);
      const articleData = JSON.parse(await fs.readFile(filePath, 'utf8'));
      const content = articleData.content || articleData.text || '';
      
      // Simple hash of content for comparison (you could use more sophisticated methods)
      const contentHash = content.substring(0, 100); // Use first 100 chars as simple hash
      
      if (relevantContents.has(contentHash)) {
        relevantDuplicates.push({ file, originalFile: relevantContents.get(contentHash) });
      } else {
        relevantContents.set(contentHash, file);
      }
    }
    
    // Process irrelevant articles
    const irrelevantFiles = await fs.readdir(IRRELEVANT_DIR);
    const irrelevantContents = new Map();
    const irrelevantDuplicates = [];
    
    for (const file of irrelevantFiles) {
      const filePath = path.join(IRRELEVANT_DIR, file);
      const articleData = JSON.parse(await fs.readFile(filePath, 'utf8'));
      const content = articleData.content || articleData.text || '';
      
      // Simple hash of content for comparison
      const contentHash = content.substring(0, 100); // Use first 100 chars as simple hash
      
      if (irrelevantContents.has(contentHash)) {
        irrelevantDuplicates.push({ file, originalFile: irrelevantContents.get(contentHash) });
      } else {
        irrelevantContents.set(contentHash, file);
      }
    }
    
    // Report results
    console.log(`\nFound ${relevantDuplicates.length} duplicate relevant articles`);
    console.log(`Found ${irrelevantDuplicates.length} duplicate irrelevant articles`);
    
    if (relevantDuplicates.length === 0 && irrelevantDuplicates.length === 0) {
      logger.info("No duplicates found");
      return;
    }
    
    const shouldRemove = await askQuestion("\nDo you want to remove duplicates? (y/n): ");
    
    if (shouldRemove.toLowerCase() === 'y') {
      // Remove duplicates
      for (const dup of relevantDuplicates) {
        await fs.unlink(path.join(RELEVANT_DIR, dup.file));
      }
      
      for (const dup of irrelevantDuplicates) {
        await fs.unlink(path.join(IRRELEVANT_DIR, dup.file));
      }
      
      logger.success(`Removed ${relevantDuplicates.length + irrelevantDuplicates.length} duplicate articles`);
    }
  } catch (err) {
    logger.error("Error removing duplicates", err);
  }
};

/**
 * Balance dataset by subsampling the majority class
 */
const balanceDataset = async () => {
  try {
    const relevantFiles = await fs.readdir(RELEVANT_DIR);
    const irrelevantFiles = await fs.readdir(IRRELEVANT_DIR);
    
    console.log(`\nCurrent dataset: ${relevantFiles.length} relevant, ${irrelevantFiles.length} irrelevant`);
    
    if (relevantFiles.length === irrelevantFiles.length) {
      logger.info("Dataset is already balanced");
      return;
    }
    
    // Determine majority class
    let majorityClass, majorityDir, majorityFiles, minorityCount;
    if (relevantFiles.length > irrelevantFiles.length) {
      majorityClass = 'relevant';
      majorityDir = RELEVANT_DIR;
      majorityFiles = relevantFiles;
      minorityCount = irrelevantFiles.length;
    } else {
      majorityClass = 'irrelevant';
      majorityDir = IRRELEVANT_DIR;
      majorityFiles = irrelevantFiles;
      minorityCount = relevantFiles.length;
    }
    
    console.log(`The ${majorityClass} class has more articles (${majorityFiles.length} vs ${minorityCount})`);
    
    const shouldBalance = await askQuestion(`\nBalance dataset by keeping only ${minorityCount} random ${majorityClass} articles? (y/n): `);
    
    if (shouldBalance.toLowerCase() === 'y') {
      // Shuffle the majority class files
      const shuffled = [...majorityFiles].sort(() => 0.5 - Math.random());
      
      // Keep only the first minorityCount files
      const filesToKeep = shuffled.slice(0, minorityCount);
      const filesToRemove = shuffled.slice(minorityCount);
      
      // Create a backup directory
      const backupDir = path.join(TRAINING_DIR, `backup-${majorityClass}-${new Date().toISOString().replace(/:/g, '-')}`);
      await fs.mkdir(backupDir, { recursive: true });
      
      // Move excess files to backup
      for (const file of filesToRemove) {
        const sourcePath = path.join(majorityDir, file);
        const destPath = path.join(backupDir, file);
        await fs.rename(sourcePath, destPath);
      }
      
      logger.success(`Balanced dataset: Now has ${minorityCount} ${majorityClass} and ${minorityCount} ${majorityClass === 'relevant' ? 'irrelevant' : 'relevant'} articles`);
      logger.info(`Moved ${filesToRemove.length} ${majorityClass} articles to backup directory: ${backupDir}`);
    }
  } catch (err) {
    logger.error("Error balancing dataset", err);
  }
};

/**
 * Clean all training data
 */
const cleanTrainingData = async () => {
  try {
    const confirmation = await askQuestion("\nWARNING: This will delete ALL labeled training data. Are you sure? (type 'DELETE' to confirm): ");
    
    if (confirmation !== 'DELETE') {
      logger.info("Operation cancelled");
      return;
    }
    
    // Create backup before deleting
    const backupDir = path.join(DATA_DIR, `training-backup-${new Date().toISOString().replace(/:/g, '-')}`);
    await fs.mkdir(backupDir, { recursive: true });
    
    // Copy current training data to backup
    const backupRelevantDir = path.join(backupDir, 'relevant');
    const backupIrrelevantDir = path.join(backupDir, 'irrelevant');
    
    await fs.mkdir(backupRelevantDir, { recursive: true });
    await fs.mkdir(backupIrrelevantDir, { recursive: true });
    
    // Copy relevant files
    const relevantFiles = await fs.readdir(RELEVANT_DIR);
    for (const file of relevantFiles) {
      await fs.copyFile(path.join(RELEVANT_DIR, file), path.join(backupRelevantDir, file));
    }
    
    // Copy irrelevant files
    const irrelevantFiles = await fs.readdir(IRRELEVANT_DIR);
    for (const file of irrelevantFiles) {
      await fs.copyFile(path.join(IRRELEVANT_DIR, file), path.join(backupIrrelevantDir, file));
    }
    
    // Copy features file
    await fs.copyFile(FEATURES_FILE, path.join(backupDir, 'features.json'));
    
    // Now delete all files
    for (const file of relevantFiles) {
      await fs.unlink(path.join(RELEVANT_DIR, file));
    }
    
    for (const file of irrelevantFiles) {
      await fs.unlink(path.join(IRRELEVANT_DIR, file));
    }
    
    // Reset features file
    await fs.writeFile(FEATURES_FILE, JSON.stringify({
      wordFrequencies: {},
      relevantKeywords: [],
      irrelevantKeywords: [],
      stats: {
        totalRelevant: 0,
        totalIrrelevant: 0,
        lastUpdated: new Date().toISOString()
      }
    }, null, 2));
    
    logger.success("All training data has been cleaned");
    logger.info(`Backup created at: ${backupDir}`);
  } catch (err) {
    logger.error("Error cleaning training data", err);
  }
};

// Export the functions for use in other modules
export {
  trainingDataManager,
  importArticles,
  labelArticles,
  viewDatasetStats,
  generateFeatures,
  exportTrainingData,
  manageTrainingData
};

// Run the manager when executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  trainingDataManager().catch(err => {
    console.error("Error in Training Data Manager:", err);
    process.exit(1);
  });
}