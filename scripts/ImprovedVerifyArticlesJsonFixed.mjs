// scripts/ImprovedVerifyArticlesJsonFixed.mjs
import fs from 'fs/promises';
import { createInterface } from 'readline';

// Improved function to check if article is related to jobs and employment
function isJobRelated(title, content) {
  // Primary job-specific keywords
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
  
  // Infrastructure and economic development keywords
  const developmentKeywords = [
    'construction', 'build', 'building', 'development', 'expansion', 'expand',
    'project', 'investment', 'investing', 'infrastructure', 'economic development',
    'growth', 'billion dollar', 'million dollar', '$4b', '$4 billion', '$4 b',
    'new terminal', 'new facility', 'new building', 'breaking ground',
    'groundbreaking', 'redevelopment', 'revitalization'
  ];
  
  // Company/organization types that often create jobs
  const organizationKeywords = [
    'airport', 'airline', 'company', 'corporation', 'business', 'enterprise',
    'firm', 'industry', 'tech', 'technology', 'hospital', 'university',
    'college', 'school', 'restaurant', 'hotel', 'retail', 'mall', 'store',
    'shop', 'factory', 'plant', 'manufacturer'
  ];
  
  const titleLower = title.toLowerCase();
  const contentLower = content.toLowerCase();
  
  // Check if title directly mentions jobs or employment
  const titleJobMatch = jobKeywords.some(keyword => titleLower.includes(keyword));
  if (titleJobMatch) return true;
  
  // Check if title has strong development keywords
  const titleDevMatch = developmentKeywords.some(keyword => titleLower.includes(keyword));
  
  // Check if title has organization keywords
  const titleOrgMatch = organizationKeywords.some(keyword => titleLower.includes(keyword));
  
  // If title has both development and organization keywords, it's likely job-related
  if (titleDevMatch && titleOrgMatch) return true;
  
  // Check for dollar amounts in title (indicates investment)
  if (titleLower.match(/\$\d+(\.\d+)?( )?(million|billion|m|b)/i)) return true;
  
  // For content, count appearances of each keyword type
  let jobKeywordCount = 0;
  let devKeywordCount = 0;
  let orgKeywordCount = 0;
  
  for (const keyword of jobKeywords) {
    if (contentLower.includes(keyword)) {
      jobKeywordCount++;
      if (jobKeywordCount >= 3) return true; // 3+ direct job keywords = relevant
    }
  }
  
  for (const keyword of developmentKeywords) {
    if (contentLower.includes(keyword)) {
      devKeywordCount++;
    }
  }
  
  for (const keyword of organizationKeywords) {
    if (contentLower.includes(keyword)) {
      orgKeywordCount++;
    }
  }
  
  // Combined keyword strategy - different combinations suggest job relevance
  if (jobKeywordCount >= 2 && (devKeywordCount >= 1 || orgKeywordCount >= 1)) return true;
  if (devKeywordCount >= 2 && orgKeywordCount >= 2) return true;
  
  // Check specifically for construction/building projects with dollar amounts
  if (contentLower.match(/\$\d+(\.\d+)?( )?(million|billion|m|b)/i) && 
      devKeywordCount >= 1) return true;
  
  // Special case for airlines and airports (which create many jobs)
  if ((titleLower.includes('airport') || titleLower.includes('airline') || 
       titleLower.includes('american airlines') || titleLower.includes('terminal')) &&
      (contentLower.includes('new') || contentLower.includes('plan') || 
       contentLower.includes('develop') || contentLower.includes('build'))) {
    return true;
  }
  
  return false;
}

const verifyArticlesJson = async () => {
  try {
    // Read the backup file from before we filtered
    const data = await fs.readFile('./public/data/articles_backup_before_job_filter.json', 'utf8');
    const articles = JSON.parse(data);
    
    console.log(`📊 Found ${articles.length} articles in backup file`);
    
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
    
    console.log(`\n📊 Results with improved filtering:`);
    console.log(`✅ Job-related articles: ${jobRelatedCount}`);
    console.log(`❌ Non-job-related articles: ${nonJobRelatedCount}`);
    
    // List the job-related articles
    console.log('\n✅ Job-related articles that will be kept:');
    jobRelatedArticles.forEach((article, index) => {
      console.log(`${index + 1}. ${article.title} (${article.date})`);
    });
    
    // List the non-job-related articles
    console.log('\n❌ Non-job-related articles that will be removed:');
    nonJobRelatedArticles.forEach((article, index) => {
      console.log(`${index + 1}. ${article.title} (${article.date})`);
    });
    
    // Apply the improved filtering directly
    console.log('\n✍️ Applying the improved filtering to articles.json...');
    
    // Write the job-related articles to the file
    await fs.writeFile(
      './public/data/articles.json', 
      JSON.stringify(jobRelatedArticles, null, 2)
    );
    
    console.log(`✅ Successfully filtered articles.json to keep only job-related content`);
    console.log(`✅ Kept ${jobRelatedCount} job-related articles`);
    console.log(`✅ Removed ${nonJobRelatedCount} non-job-related articles`);
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
};

verifyArticlesJson().catch(console.error);