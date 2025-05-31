// verify-training-data.mjs
import fs from 'fs/promises';
import path from 'path';

async function verifyDirectory(dirPath, expectedCategory) {
  try {
    console.log(`\n📁 Checking ${dirPath}...`);
    
    // Check if directory exists
    try {
      await fs.access(dirPath);
    } catch (err) {
      console.error(`❌ Directory ${dirPath} does not exist!`);
      return false;
    }
    
    // Get all JSON files
    const files = await fs.readdir(dirPath);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    console.log(`📊 Found ${jsonFiles.length} JSON files`);
    
    if (jsonFiles.length === 0) {
      console.error(`❌ No JSON files found in ${dirPath}`);
      return false;
    }
    
    // Check a few sample files
    const samplesToCheck = Math.min(3, jsonFiles.length);
    let validFiles = 0;
    
    for (let i = 0; i < samplesToCheck; i++) {
      const fileName = jsonFiles[i];
      const filePath = path.join(dirPath, fileName);
      
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(content);
        
        // Check required fields
        const hasTitle = data.title && typeof data.title === 'string';
        const hasContent = data.content && typeof data.content === 'string';
        const hasUrl = data.url && typeof data.url === 'string';
        const hasDate = data.date && typeof data.date === 'string';
        
        if (hasTitle && hasContent && hasUrl && hasDate) {
          validFiles++;
          console.log(`✅ ${fileName} - Valid (${data.content.length} chars)`);
        } else {
          console.log(`⚠️  ${fileName} - Missing fields:`);
          if (!hasTitle) console.log(`   - Missing or invalid title`);
          if (!hasContent) console.log(`   - Missing or invalid content`);
          if (!hasUrl) console.log(`   - Missing or invalid url`);
          if (!hasDate) console.log(`   - Missing or invalid date`);
        }
        
        // Show content preview
        if (data.content) {
          const preview = data.content.substring(0, 100).replace(/\n/g, ' ');
          console.log(`   Preview: "${preview}..."`);
        }
        
      } catch (err) {
        console.error(`❌ ${fileName} - Invalid JSON: ${err.message}`);
      }
    }
    
    const successRate = (validFiles / samplesToCheck) * 100;
    console.log(`📈 Sample validation rate: ${successRate.toFixed(1)}%`);
    
    return validFiles === samplesToCheck;
    
  } catch (err) {
    console.error(`❌ Error checking ${dirPath}: ${err.message}`);
    return false;
  }
}

async function checkOverallStructure() {
  console.log('🔍 VERIFYING TRAINING DATA STRUCTURE\n');
  
  const requiredDirs = [
    { path: 'data/training/relevant', category: 'relevant' },
    { path: 'data/training/irrelevant', category: 'irrelevant' }
  ];
  
  let allValid = true;
  
  for (const dir of requiredDirs) {
    const isValid = await verifyDirectory(dir.path, dir.category);
    allValid = allValid && isValid;
  }
  
  // Check if test directory exists (optional)
  try {
    await fs.access('data/test');
    await verifyDirectory('data/test', 'test');
  } catch (err) {
    console.log('\n📁 Test directory not found - will create test data when needed');
  }
  
  console.log('\n' + '='.repeat(50));
  if (allValid) {
    console.log('✅ DATA VERIFICATION PASSED');
    console.log('✅ Ready to train models!');
  } else {
    console.log('❌ DATA VERIFICATION FAILED');
    console.log('❌ Please fix the issues above before training');
  }
  console.log('='.repeat(50));
  
  return allValid;
}

// Additional function to show data statistics
async function showDataStats() {
  console.log('\n📊 DATA STATISTICS');
  
  try {
    const relevantFiles = await fs.readdir('data/training/relevant');
    const irrelevantFiles = await fs.readdir('data/training/irrelevant');
    
    const relevantCount = relevantFiles.filter(f => f.endsWith('.json')).length;
    const irrelevantCount = irrelevantFiles.filter(f => f.endsWith('.json')).length;
    
    console.log(`📈 Relevant articles: ${relevantCount}`);
    console.log(`📉 Irrelevant articles: ${irrelevantCount}`);
    console.log(`📊 Total training articles: ${relevantCount + irrelevantCount}`);
    
    if (relevantCount + irrelevantCount > 0) {
      console.log(`⚖️  Balance ratio: ${(relevantCount / (relevantCount + irrelevantCount) * 100).toFixed(1)}% relevant`);
    }
    
    // Analyze content lengths
    let totalContentLength = 0;
    let minLength = Infinity;
    let maxLength = 0;
    let articleCount = 0;
    
    for (const dir of ['data/training/relevant', 'data/training/irrelevant']) {
      try {
        const files = await fs.readdir(dir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            try {
              const data = JSON.parse(await fs.readFile(path.join(dir, file), 'utf8'));
              if (data.content) {
                const length = data.content.length;
                totalContentLength += length;
                minLength = Math.min(minLength, length);
                maxLength = Math.max(maxLength, length);
                articleCount++;
              }
            } catch (err) {
              // Skip invalid files
            }
          }
        }
      } catch (err) {
        // Skip directories that don't exist
      }
    }
    
    if (articleCount > 0) {
      console.log(`📝 Average content length: ${Math.round(totalContentLength / articleCount)} characters`);
      console.log(`📏 Content length range: ${minLength} - ${maxLength} characters`);
    }
  } catch (err) {
    console.log('📊 Could not gather detailed statistics');
  }
}

// Main execution
async function main() {
  const isValid = await checkOverallStructure();
  
  if (isValid) {
    await showDataStats();
    console.log('\n🚀 You can now run the model trainer!');
    console.log('   Command: node src/tools/model-trainer.mjs');
  } else {
    console.log('\n🔧 Please fix the data issues and run this verification again.');
  }
}

main().catch(console.error);
