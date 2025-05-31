// format-articles-properly.mjs
import fs from 'fs/promises';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

// Function to get the next article number
async function getNextArticleNumber(categoryDir, category) {
  try {
    const files = await fs.readdir(categoryDir);
    
    // Filter for files matching the pattern
    const articleFiles = files.filter(file => 
      file.startsWith(`${category}-article-`) && file.endsWith('.json')
    );
    
    if (articleFiles.length === 0) {
      return 1;
    }
    
    // Extract numbers from filenames
    const numbers = articleFiles.map(file => {
      const match = file.match(/article-(\d+)\.json$/);
      return match ? parseInt(match[1], 10) : 0;
    }).filter(num => num > 0);
    
    if (numbers.length === 0) {
      return 1;
    }
    
    // Return the highest number + 1
    return Math.max(...numbers) + 1;
  } catch (err) {
    // If directory doesn't exist, start from 1
    return 1;
  }
}

// Function to safely create JSON from raw content
function createArticleJSON(title, content, url, date, category) {
  // Clean up the content - remove extra whitespace and normalize
  const cleanContent = content
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .trim();               // Remove leading/trailing whitespace
  
  const article = {
    title: title.trim(),
    content: cleanContent,
    url: url.trim(),
    date: date
  };
  
  // JSON.stringify automatically handles escaping quotes and special characters
  return JSON.stringify(article, null, 2);
}

// Interactive mode to add articles one by one
async function addArticlesInteractively() {
  console.log('🔧 INTERACTIVE ARTICLE FORMATTER\n');
  console.log('This will help you add articles with proper JSON formatting.\n');
  
  const category = await askQuestion('Is this article relevant or irrelevant? (relevant/irrelevant): ');
  
  if (!['relevant', 'irrelevant'].includes(category.toLowerCase())) {
    console.log('❌ Please enter either "relevant" or "irrelevant"');
    rl.close();
    return;
  }
  
  const categoryDir = `data/training/${category.toLowerCase()}`;
  await fs.mkdir(categoryDir, { recursive: true });
  
  // Get the next article number based on existing files
  let articleCount = await getNextArticleNumber(categoryDir, category.toLowerCase());
  console.log(`\n📊 Found ${articleCount - 1} existing ${category} articles. Starting from #${articleCount}\n`);
  
  let continueAdding = true;
  
  while (continueAdding) {
    console.log(`\n📝 Adding ${category} article #${articleCount}:`);
    
    const title = await askQuestion('Article title: ');
    if (!title.trim()) {
      console.log('❌ Title cannot be empty');
      continue;
    }
    
    console.log('Article content (paste all content, then press Enter twice when done):');
    let content = '';
    let emptyLineCount = 0;
    
    // Read content until user presses Enter twice
    while (emptyLineCount < 2) {
      const line = await askQuestion('');
      if (line.trim() === '') {
        emptyLineCount++;
      } else {
        emptyLineCount = 0;
        content += line + ' ';
      }
    }
    
    if (!content.trim()) {
      console.log('❌ Content cannot be empty');
      continue;
    }
    
    const url = await askQuestion('Article URL: ');
    const date = await askQuestion('Article date (YYYY-MM-DD) or press Enter for today: ');
    
    const articleDate = date.trim() || new Date().toISOString().split('T')[0];
    
    // Create properly formatted JSON
    const articleJSON = createArticleJSON(title, content, url, articleDate, category);
    
    // Save to file with padded number
    const fileName = `${category.toLowerCase()}-article-${articleCount.toString().padStart(2, '0')}.json`;
    const filePath = path.join(categoryDir, fileName);
    
    // Check if file already exists (just in case)
    try {
      await fs.access(filePath);
      console.log(`⚠️  File ${fileName} already exists. Skipping to next number...`);
      articleCount++;
      continue;
    } catch (err) {
      // File doesn't exist, good to proceed
    }
    
    await fs.writeFile(filePath, articleJSON);
    
    console.log(`✅ Saved ${fileName}`);
    
    const continueResponse = await askQuestion('\nAdd another article? (y/n): ');
    continueAdding = continueResponse.toLowerCase() === 'y';
    articleCount++;
  }
  
  console.log('\n🎉 Finished adding articles!');
  console.log(`📊 Total ${category} articles now: ${articleCount - 1}`);
  rl.close();
}

// Batch mode for processing multiple files
async function processBatchFiles() {
  console.log('📁 BATCH FILE PROCESSOR\n');
  
  const inputDir = await askQuestion('Enter directory path containing text files: ');
  const category = await askQuestion('Are these articles relevant or irrelevant? (relevant/irrelevant): ');
  
  if (!['relevant', 'irrelevant'].includes(category.toLowerCase())) {
    console.log('❌ Please enter either "relevant" or "irrelevant"');
    rl.close();
    return;
  }
  
  try {
    const files = await fs.readdir(inputDir);
    const textFiles = files.filter(file => file.endsWith('.txt'));
    
    if (textFiles.length === 0) {
      console.log('❌ No .txt files found in the specified directory');
      rl.close();
      return;
    }
    
    const categoryDir = `data/training/${category.toLowerCase()}`;
    await fs.mkdir(categoryDir, { recursive: true });
    
    // Get the next article number
    let startNumber = await getNextArticleNumber(categoryDir, category.toLowerCase());
    
    console.log(`Found ${textFiles.length} text files. Processing...`);
    console.log(`Starting from article #${startNumber}\n`);
    
    for (let i = 0; i < textFiles.length; i++) {
      const file = textFiles[i];
      const filePath = path.join(inputDir, file);
      const content = await fs.readFile(filePath, 'utf8');
      
      // Use filename as title (remove .txt extension)
      const title = file.replace('.txt', '').replace(/[-_]/g, ' ');
      const url = `https://example.com/${file.replace('.txt', '')}`;
      const date = new Date().toISOString().split('T')[0];
      
      const articleJSON = createArticleJSON(title, content, url, date, category);
      
      const outputFileName = `${category.toLowerCase()}-article-${(startNumber + i).toString().padStart(2, '0')}.json`;
      const outputPath = path.join(categoryDir, outputFileName);
      
      await fs.writeFile(outputPath, articleJSON);
      console.log(`✅ Processed ${file} -> ${outputFileName}`);
    }
    
    console.log(`\n🎉 Successfully processed ${textFiles.length} files!`);
    console.log(`📊 Total ${category} articles now: ${startNumber + textFiles.length - 1}`);
  } catch (err) {
    console.error(`❌ Error processing files: ${err.message}`);
  }
  
  rl.close();
}

// Fix existing corrupted JSON files
async function fixExistingFiles() {
  console.log('🔧 FIX EXISTING JSON FILES\n');
  
  const directory = await askQuestion('Enter directory path containing corrupted JSON files: ');
  
  try {
    const files = await fs.readdir(directory);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    if (jsonFiles.length === 0) {
      console.log('❌ No JSON files found in the specified directory');
      rl.close();
      return;
    }
    
    console.log(`Found ${jsonFiles.length} JSON files. Checking and fixing...`);
    
    for (const file of jsonFiles) {
      const filePath = path.join(directory, file);
      
      try {
        // Try to read as JSON first
        const content = await fs.readFile(filePath, 'utf8');
        JSON.parse(content); // Test if it's valid JSON
        console.log(`✅ ${file} is already valid`);
      } catch (parseError) {
        console.log(`🔧 Fixing ${file}...`);
        
        // If JSON is invalid, try to extract and reformat
        const rawContent = await fs.readFile(filePath, 'utf8');
        
        // Simple extraction - you might need to adjust this based on your data
        const title = `Fixed Article - ${file}`;
        const url = `https://example.com/${file.replace('.json', '')}`;
        const date = new Date().toISOString().split('T')[0];
        
        const fixedJSON = createArticleJSON(title, rawContent, url, date, 'unknown');
        await fs.writeFile(filePath, fixedJSON);
        console.log(`✅ Fixed ${file}`);
      }
    }
    
    console.log('\n🎉 Finished fixing files!');
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
  }
  
  rl.close();
}

async function main() {
  console.log('🔧 ARTICLE FORMATTER TOOL\n');
  console.log('Choose an option:');
  console.log('1. Add articles interactively (one by one)');
  console.log('2. Process batch text files');
  console.log('3. Fix existing corrupted JSON files');
  console.log('4. Exit');
  
  const choice = await askQuestion('\nSelect an option (1-4): ');
  
  switch (choice) {
    case '1':
      await addArticlesInteractively();
      break;
    case '2':
      await processBatchFiles();
      break;
    case '3':
      await fixExistingFiles();
      break;
    case '4':
      console.log('👋 Goodbye!');
      rl.close();
      break;
    default:
      console.log('❌ Invalid option');
      rl.close();
      break;
  }
}

main().catch(console.error);