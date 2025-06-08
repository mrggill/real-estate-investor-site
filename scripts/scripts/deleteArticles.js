import fs from 'fs/promises';
import path from 'path';

async function deleteArticles() {
  try {
    // Read the articles
    const dataPath = path.join(process.cwd(), 'public', 'data', 'articles.json');
    const articlesData = await fs.readFile(dataPath, 'utf8');
    const articles = JSON.parse(articlesData);

    console.log(`Current number of articles: ${articles.length}`);

    // Option 1: Delete by URL
    const urlToDelete = process.argv[2];
    if (urlToDelete) {
      const filteredArticles = articles.filter(article => article.url !== urlToDelete);
      await fs.writeFile(dataPath, JSON.stringify(filteredArticles, null, 2));
      console.log(`✅ Deleted article with URL: ${urlToDelete}`);
      console.log(`Remaining articles: ${filteredArticles.length}`);
      return;
    }

    // Option 2: Interactive deletion
    console.log('\nRecent articles:');
    articles.slice(0, 10).forEach((article, index) => {
      console.log(`${index + 1}. ${article.title} (${article.date})`);
      console.log(`   URL: ${article.url}`);
      console.log(`   Content preview: ${article.content.substring(0, 100)}...`);
      console.log('---');
    });

    console.log('\nTo delete an article, run:');
    console.log('node scripts/deleteArticles.js "ARTICLE_URL"');

  } catch (error) {
    console.error('Error:', error);
  }
}

// Better solution: Create a filter script
async function filterArticles() {
  try {
    const dataPath = path.join(process.cwd(), 'public', 'data', 'articles.json');
    const articlesData = await fs.readFile(dataPath, 'utf8');
    const articles = JSON.parse(articlesData);

    // Filter out articles with cookie/privacy content
    const filteredArticles = articles.filter(article => {
      const badContent = [
        'THIS WEBSITE USES COOKIES',
        'We use cookies to enhance',
        'personalize content and ads',
        'Skip to main content'
      ];
      
      // Check if content contains cookie notices
      const hasJunkContent = badContent.some(junk => 
        article.content.includes(junk) || 
        article.state?.includes(junk) ||
        article.city?.includes(junk)
      );
      
      return !hasJunkContent;
    });

    // Clean up any cookie content from remaining articles
    const cleanedArticles = filteredArticles.map(article => {
      // Clean the content
      let cleanContent = article.content;
      cleanContent = cleanContent.replace(/THIS WEBSITE USES COOKIES.*?Skip to main content/gs, '');
      cleanContent = cleanContent.replace(/We use cookies.*?OK/gs, '');
      cleanContent = cleanContent.trim();

      // Clean state/city fields
      let cleanState = article.state || '';
      let cleanCity = article.city || '';
      
      if (cleanState.includes('personalize content')) {
        cleanState = 'TX'; // Default to TX or extract properly
      }

      return {
        ...article,
        content: cleanContent,
        state: cleanState,
        city: cleanCity
      };
    });

    await fs.writeFile(dataPath, JSON.stringify(cleanedArticles, null, 2));
    console.log(`✅ Cleaned ${articles.length} articles -> ${cleanedArticles.length} clean articles`);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the appropriate function
if (process.argv[2] === '--clean') {
  filterArticles();
} else {
  deleteArticles();
}