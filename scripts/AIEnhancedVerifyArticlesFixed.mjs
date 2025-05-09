// scripts/AIEnhancedVerifyArticlesFixed.mjs
import 'dotenv/config';
import fs from 'fs/promises';
import axios from 'axios';

const openaiApiKey = process.env.OPENAI_API_KEY;

// Function to check if article is job/economy relevant using AI
async function isJobRelevantWithAI(title, content) {
  try {
    // Prepare a prompt for the AI
    const prompt = `
Article Title: "${title}"

Article Content:
${content.slice(0, 1000)}${content.length > 1000 ? '...' : ''}

Question: Is this article relevant to jobs, employment, economic development, or business expansion?

Consider the following criteria:
1. Does it discuss job creation, job losses, hiring, or employment trends?
2. Does it mention new businesses, facilities, or expansions that would create jobs?
3. Does it involve significant infrastructure projects (like airports, buildings, factories) that would impact employment?
4. Does it discuss economic development initiatives, business relocations, or company investments?
5. Does it mention manufacturing, production, distribution centers, logistics, or industrial facilities?

Answer with ONLY "Yes" or "No" first, then explain your reasoning in one sentence.
`;

    // Call the OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent responses
        max_tokens: 150   // Keep it brief
      },
      {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = response.data.choices[0].message.content.trim();
    
    // Extract the Yes/No answer
    const isRelevant = aiResponse.toLowerCase().startsWith('yes');
    
    return {
      isRelevant,
      explanation: aiResponse.replace(/^(yes|no)[.,: ]*/i, '').trim()
    };
  } catch (error) {
    console.error('Error calling OpenAI API:', error.message);
    // Default to keyword-based filtering if API fails
    return { isRelevant: isJobRelatedByKeywords(title, content), explanation: 'AI analysis failed, falling back to keywords' };
  }
}

// Function to correct grammatical errors in title using AI
async function correctGrammarWithAI(title) {
  try {
    // Prepare a prompt for the AI
    const prompt = `
Correct any spelling, grammatical errors, or typos in the following text. If there are no errors, return the original text unchanged:

"${title}"

Only return the corrected text, with no additional comments or explanations.
`;

    // Call the OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.0, // Use zero temperature for consistent corrections
        max_tokens: 100   // Keep it brief
      },
      {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const correctedTitle = response.data.choices[0].message.content.trim();
    
    // Only return the corrected title if it's different from the original
    if (correctedTitle !== title) {
      console.log(`🔍 Corrected title: "${title}" → "${correctedTitle}"`);
    }
    
    return correctedTitle;
  } catch (error) {
    console.error('Error calling OpenAI API for grammar correction:', error.message);
    // Return original title if correction fails
    return title;
  }
}

// Fallback keyword-based method if AI fails
function isJobRelatedByKeywords(title, content) {
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
  
  // Special case for airlines and airports (which create many jobs)
  if ((titleLower.includes('airport') || titleLower.includes('airline') || 
       titleLower.includes('american airlines') || titleLower.includes('terminal')) &&
      (contentLower.includes('new') || contentLower.includes('plan') || 
       contentLower.includes('develop') || contentLower.includes('build'))) {
    return true;
  }
  
  // Check for dollar amounts in title (indicates investment)
  if (titleLower.match(/\$\d+(\.\d+)?( )?(million|billion|m|b)/i)) return true;
  
  return false;
}

const verifyArticlesJsonWithAI = async () => {
  try {
    // Read the backup file
    const data = await fs.readFile('./public/data/articles_backup_before_job_filter.json', 'utf8');
    const articles = JSON.parse(data);
    
    console.log(`📊 Found ${articles.length} articles in backup file`);
    console.log(`🤖 Analyzing each article with AI for job/economic relevance and correcting grammar...`);
    
    const jobRelatedArticles = [];
    const nonJobRelatedArticles = [];
    const analysisResults = [];
    
    // Process each article
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      console.log(`\n🔍 Analyzing article ${i+1}/${articles.length}: "${article.title}"`);
      
      try {
        // Correct grammar in the title
        const correctedTitle = await correctGrammarWithAI(article.title);
        
        // Only update if there were corrections
        if (correctedTitle !== article.title) {
          article.title = correctedTitle;
        }
        
        // Try AI-based analysis for relevance
        const { isRelevant, explanation } = await isJobRelevantWithAI(article.title, article.content);
        
        if (isRelevant) {
          jobRelatedArticles.push(article);
          console.log(`✅ AI determined this is job-related: ${explanation}`);
        } else {
          nonJobRelatedArticles.push(article);
          console.log(`❌ AI determined this is not job-related: ${explanation}`);
        }
        
        // Save analysis result
        analysisResults.push({
          title: article.title,
          date: article.date,
          isRelevant,
          explanation
        });
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (analysisError) {
        console.error(`Error analyzing article: ${analysisError.message}`);
        // Fall back to keyword method if AI fails
        const isRelevantByKeywords = isJobRelatedByKeywords(article.title, article.content);
        if (isRelevantByKeywords) {
          jobRelatedArticles.push(article);
          console.log(`✅ Keyword fallback determined this is job-related`);
        } else {
          nonJobRelatedArticles.push(article);
          console.log(`❌ Keyword fallback determined this is not job-related`);
        }
      }
    }
    
    // Save the analysis results for review
    await fs.writeFile(
      './debug/ai_analysis_results.json',
      JSON.stringify(analysisResults, null, 2)
    );
    
    console.log(`\n📊 AI Analysis Results:`);
    console.log(`✅ Job-related articles: ${jobRelatedArticles.length}`);
    console.log(`❌ Non-job-related articles: ${nonJobRelatedArticles.length}`);
    
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
    
    console.log('\n✍️ Applying the AI-based filtering to articles.json...');
    
    // Write only job-related articles back to the file
    await fs.writeFile(
      './public/data/articles.json', 
      JSON.stringify(jobRelatedArticles, null, 2)
    );
    
    console.log(`\n✅ Successfully filtered articles.json to keep only job-related content`);
    console.log(`✅ Kept ${jobRelatedArticles.length} job-related articles`);
    console.log(`✅ Removed ${nonJobRelatedArticles.length} non-job-related articles`);
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
};

verifyArticlesJsonWithAI().catch(console.error);