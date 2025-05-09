// scripts/CleanArticlesJson.mjs
import fs from 'fs/promises';

const cleanArticlesJson = async () => {
  try {
    // Read the JSON file
    const data = await fs.readFile('./public/data/articles.json', 'utf8');
    const articles = JSON.parse(data);
    
    console.log(`📊 Found ${articles.length} articles in JSON file`);
    
    // Count articles by year
    const yearCounts = {};
    articles.forEach(article => {
      if (!article.date) return;
      const year = new Date(article.date).getFullYear();
      if (!isNaN(year)) {
        yearCounts[year] = (yearCounts[year] || 0) + 1;
      }
    });
    
    console.log('📅 Articles by year:');
    Object.entries(yearCounts)
      .sort(([a], [b]) => a - b)
      .forEach(([year, count]) => {
        console.log(`  ${year}: ${count} articles`);
      });
    
    // Filter out articles before 2023
    const newArticles = articles.filter(article => {
      if (!article.date) return false;
      const date = new Date(article.date);
      return !isNaN(date.getTime()) && date >= new Date('2023-01-01');
    });
    
    console.log(`🧹 Removed ${articles.length - newArticles.length} old articles`);
    console.log(`✏️ Writing ${newArticles.length} articles back to JSON file`);
    
    // Create a backup of the original file
    await fs.copyFile('./public/data/articles.json', './public/data/articles_backup.json');
    console.log('💾 Created backup at ./public/data/articles_backup.json');
    
    // Write the filtered articles back
    await fs.writeFile(
      './public/data/articles.json', 
      JSON.stringify(newArticles, null, 2)
    );
    
    console.log('✅ Successfully cleaned articles.json');
  } catch (err) {
    console.error('❌ Error:', err);
  }
};

cleanArticlesJson().catch(console.error);