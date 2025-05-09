// scripts/VerifyArticlesJson.mjs
import fs from 'fs/promises';

// Function to check if article is related to jobs and employment
function isJobRelated(title, content) {
  const jobKeywords = [
    // Employment and jobs
    'job', 'jobs', 'employment', 'unemployment', 'hiring', 'layoff', 'layoffs',
    'workforce', 'worker', 'workers', 'career', 'careers', 'labor market',
    'recruit', 'recruitment', 'employer', 'employers', 'employee', 'employees',
    'wage', 'wages', 'salary', 'salaries', 'job market', 'jobless', 'hire',
    'hiring', 'work force', 'remote work', 'office', 'workplace', 'job growth',
    'position', 'staff', 'talent', 'personnel', 'human resources', 'HR',
    
    // Manufacturing and production
    'production', 'manufacturing', 'factory', 'factories', 'plant', 'assembly',
    'industrial', 'fabrication', 'warehouse', 'supply chain', 'automation',
    'manufacturing jobs', 'production line', 'processing', 'assembly line',
    
    // Business relocation and facilities
    'relocating', 'relocation', 'headquarters', 'HQ', 'campus', 'office space',
    'moving operations', 'expanding operations', 'facility', 'facilities',
    'new plant', 'new location', 'opening location', 'corporate relocation',
    'moving to', 'moving from', 'expansion to', 'expansion into',
    
    // Distribution and logistics
    'distribution center', 'fulfillment center', 'logistics', 'shipping center',
    'warehouse jobs', 'distribution hub', 'supply hub', 'operations center',
    'regional center', 'storage facility', 'distribution network',
    
    // Real estate business terms
    'commercial property', 'corporate real estate',
    'business park', 'industrial park', 'commercial development',
    'business district'
  ];
  
  const titleLower = title.toLowerCase();
  const contentLower = content.toLowerCase();
  
  // Check if any keywords are in the title (higher weight)
  const titleMatch = jobKeywords.some(keyword => titleLower.includes(keyword));
  if (titleMatch) return true;
  
  // Check if multiple keywords are in the content (for better accuracy)
  let keywordCount = 0;
  const foundKeywords = [];
  for (const keyword of jobKeywords) {
    if (contentLower.includes(keyword)) {
      keywordCount++;
      foundKeywords.push(keyword);
      // If we find 3 or more different job-related keywords, consider it relevant
      if (keywordCount >= 3) return true;
    }
  }
  
  return false;
}

const verifyArticlesJson = async () => {
  try {
    // Read the JSON file
    const data = await fs.readFile('./public/data/articles.json', 'utf8');
    const articles = JSON.parse(data);
    
    console.log(`📊 Found ${articles.length} articles in JSON file`);
    
    // Create a backup
    await fs.writeFile('./public/data/articles_backup_before_job_filter.json', data);
    console.log('💾 Created backup at ./public/data/articles_backup_before_job_filter.json');
    
    // Check each article for job relevance
    let jobRelatedCount = 0;
    let nonJobRelatedCount = 0;
    const jobRelatedArticles = [];
    const nonJobRelatedArticles = [];
    
    for (const article of articles) {
      if (isJobRelated(article.title, article.content)) {
        jobRelatedArticles.push(article);
        jobRelatedCount++;
      } else {
        nonJobRelatedArticles.push(article);
        nonJobRelatedCount++;
      }
    }
    
    console.log(`\n📊 Results:`);
    console.log(`✅ Job-related articles: ${jobRelatedCount}`);
    console.log(`❌ Non-job-related articles: ${nonJobRelatedCount}`);
    
    // List the non-job-related articles
    console.log('\n❌ Non-job-related articles that will be removed:');
    nonJobRelatedArticles.forEach((article, index) => {
      console.log(`${index + 1}. ${article.title} (${article.date})`);
    });
    
    // Write only job-related articles back to the file
    await fs.writeFile(
      './public/data/articles.json', 
      JSON.stringify(jobRelatedArticles, null, 2)
    );
    
    console.log(`\n✅ Successfully filtered articles.json to keep only job-related content`);
    console.log(`✅ Kept ${jobRelatedCount} job-related articles`);
    console.log(`✅ Removed ${nonJobRelatedCount} non-job-related articles`);
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
};

verifyArticlesJson().catch(console.error);