// scripts/CheckArticleContent.mjs
import fs from 'fs/promises';

const checkArticleContent = async () => {
  try {
    const data = await fs.readFile('./public/data/articles.json', 'utf8');
    const articles = JSON.parse(data);
    
    const floodArticle = articles.find(article => 
      article.title.includes('flood watch')
    );
    
    if (floodArticle) {
      console.log('Article details:');
      console.log(`Title: ${floodArticle.title}`);
      console.log(`Date: ${floodArticle.date}`);
      console.log(`Content length: ${floodArticle.content.length} characters`);
      console.log('\nFull content:');
      console.log(floodArticle.content);
      
      // Check for job-related keywords
      const jobKeywords = [
        'job', 'jobs', 'employment', 'unemployment', 'hiring', 'layoff', 'layoffs',
        'workforce', 'worker', 'workers', 'career', 'careers', 'labor market',
        'recruit', 'recruitment', 'employer', 'employers', 'employee', 'employees',
        'wage', 'wages', 'salary', 'salaries', 'job market', 'jobless', 'hire',
        'hiring', 'work force', 'remote work', 'office', 'workplace', 'job growth',
        'position', 'staff', 'talent', 'personnel', 'human resources', 'HR',
        'production', 'manufacturing', 'factory', 'factories', 'plant', 'assembly',
        'industrial', 'fabrication', 'warehouse', 'supply chain', 'automation',
        'manufacturing jobs', 'production line', 'processing', 'assembly line',
        'relocating', 'relocation', 'headquarters', 'HQ', 'campus', 'office space',
        'moving operations', 'expanding operations', 'facility', 'facilities',
        'new plant', 'new location', 'opening location', 'corporate relocation',
        'moving to', 'moving from', 'expansion to', 'expansion into',
        'distribution center', 'fulfillment center', 'logistics', 'shipping center',
        'warehouse jobs', 'distribution hub', 'supply hub', 'operations center',
        'regional center', 'storage facility', 'distribution network',
        'commercial property', 'corporate real estate',
        'business park', 'industrial park', 'commercial development',
        'business district'
      ];
      
      const contentLower = floodArticle.content.toLowerCase();
      const foundKeywords = jobKeywords.filter(keyword => 
        contentLower.includes(keyword)
      );
      
      console.log('\nJob-related keywords found:');
      console.log(foundKeywords);
      console.log(`Total keywords found: ${foundKeywords.length}`);
    } else {
      console.log('Flood watch article not found');
    }
  } catch (err) {
    console.error('Error:', err);
  }
};

checkArticleContent().catch(console.error);