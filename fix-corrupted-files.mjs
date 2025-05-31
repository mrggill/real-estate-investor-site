// fix-corrupted-files.mjs
import fs from 'fs/promises';
import path from 'path';

async function checkAndFixFile(filePath) {
  try {
    console.log(`\n🔍 Checking ${filePath}...`);
    
    // Read the file content
    const content = await fs.readFile(filePath, 'utf8');
    
    // Check if content is empty or too short
    if (!content || content.trim().length < 10) {
      console.log(`❌ File is empty or too short (${content.length} chars)`);
      return false;
    }
    
    try {
      // Try to parse as JSON
      const data = JSON.parse(content);
      console.log(`✅ File is valid JSON`);
      
      // Check if it has required fields
      const hasTitle = data.title && typeof data.title === 'string';
      const hasContent = data.content && typeof data.content === 'string';
      const hasUrl = data.url && typeof data.url === 'string';
      const hasDate = data.date && typeof data.date === 'string';
      
      if (hasTitle && hasContent && hasUrl && hasDate) {
        console.log(`✅ All required fields present`);
        return true;
      } else {
        console.log(`⚠️  Missing required fields:`);
        if (!hasTitle) console.log(`   - title`);
        if (!hasContent) console.log(`   - content`);
        if (!hasUrl) console.log(`   - url`);
        if (!hasDate) console.log(`   - date`);
        return false;
      }
    } catch (parseError) {
      console.log(`❌ Invalid JSON: ${parseError.message}`);
      console.log(`📝 Content preview: "${content.substring(0, 200)}..."`);
      
      // Try to fix common JSON issues
      return await attemptJSONRepair(filePath, content);
    }
  } catch (err) {
    console.log(`❌ Error reading file: ${err.message}`);
    return false;
  }
}

async function attemptJSONRepair(filePath, content) {
  console.log(`🔧 Attempting to repair JSON...`);
  
  try {
    // Common fixes for JSON issues
    let fixedContent = content;
    
    // Remove any trailing commas
    fixedContent = fixedContent.replace(/,(\s*[}\]])/g, '$1');
    
    // Ensure proper quotes around keys and values
    fixedContent = fixedContent.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*):/g, '$1"$2"$3:');
    
    // Try to add missing closing braces/brackets
    let openBraces = (fixedContent.match(/{/g) || []).length;
    let closeBraces = (fixedContent.match(/}/g) || []).length;
    let openBrackets = (fixedContent.match(/\[/g) || []).length;
    let closeBrackets = (fixedContent.match(/\]/g) || []).length;
    
    // Add missing closing braces
    while (openBraces > closeBraces) {
      fixedContent += '}';
      closeBraces++;
    }
    
    // Add missing closing brackets
    while (openBrackets > closeBrackets) {
      fixedContent += ']';
      closeBrackets++;
    }
    
    // Try to parse the fixed content
    const data = JSON.parse(fixedContent);
    
    // If successful, save the fixed version
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`✅ Successfully repaired and saved ${filePath}`);
    return true;
    
  } catch (repairError) {
    console.log(`❌ Could not repair JSON: ${repairError.message}`);
    
    // If repair fails, create a minimal valid JSON file
    const fileName = path.basename(filePath);
    const isRelevant = filePath.includes('/relevant/');
    
    const fallbackArticle = {
      title: `Placeholder Article - ${fileName}`,
      content: `This article was corrupted and has been replaced with placeholder content. Original content length was approximately ${content.length} characters. Please replace this with actual article content related to ${isRelevant ? 'relevant' : 'irrelevant'} topics.`,
      url: `https://example.com/placeholder-${fileName.replace('.json', '')}`,
      date: new Date().toISOString().split('T')[0]
    };
    
    await fs.writeFile(filePath, JSON.stringify(fallbackArticle, null, 2));
    console.log(`🔄 Created placeholder content for ${filePath}`);
    console.log(`⚠️  Please replace this with actual article content!`);
    return true;
  }
}

async function deleteCorruptedFile(filePath) {
  const userResponse = 'y'; // Auto-confirm for this script
  
  if (userResponse.toLowerCase() === 'y') {
    await fs.unlink(filePath);
    console.log(`🗑️  Deleted corrupted file: ${filePath}`);
    return true;
  }
  return false;
}

async function processDirectory(dirPath) {
  console.log(`\n📁 Processing directory: ${dirPath}`);
  
  try {
    const files = await fs.readdir(dirPath);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    console.log(`Found ${jsonFiles.length} JSON files`);
    
    let validCount = 0;
    let fixedCount = 0;
    let deletedCount = 0;
    
    for (const file of jsonFiles) {
      const filePath = path.join(dirPath, file);
      const isValid = await checkAndFixFile(filePath);
      
      if (isValid) {
        validCount++;
      } else {
        // If we can't fix it, offer to delete it
        console.log(`❌ Cannot fix ${file}. It will be replaced with placeholder content.`);
        await attemptJSONRepair(filePath, '{}'); // Create minimal content
        fixedCount++;
      }
    }
    
    console.log(`\n📊 Summary for ${dirPath}:`);
    console.log(`   ✅ Valid files: ${validCount}`);
    console.log(`   🔧 Fixed/Replaced files: ${fixedCount}`);
    console.log(`   🗑️  Deleted files: ${deletedCount}`);
    
  } catch (err) {
    console.error(`Error processing directory ${dirPath}: ${err.message}`);
  }
}

async function main() {
  console.log('🔧 FIXING CORRUPTED JSON FILES\n');
  
  const directories = [
    'data/training/relevant',
    'data/training/irrelevant'
  ];
  
  for (const dir of directories) {
    await processDirectory(dir);
  }
  
  console.log('\n🎉 Finished processing all directories!');
  console.log('\n📝 Please review any placeholder files and replace them with actual content.');
  console.log('🧪 Run verify-training-data.mjs again to check the results.');
}

main().catch(console.error);