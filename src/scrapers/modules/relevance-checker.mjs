// src/scrapers/modules/relevance-checker.mjs
import axios from 'axios';
import logger from '../utils/logger.mjs';

// Default job-related keywords
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
  'business district',
  
  // Infrastructure and economic development
  'construction', 'build', 'building', 'development', 'expansion', 'expand',
  'project', 'investment', 'investing', 'infrastructure', 'economic development',
  'growth', 'billion dollar', 'million dollar',
  
  // Added: Government funding and civic projects
  'subsidy', 'subsidies', 'incentive', 'grant', 'funding', 'funds',
  'public funds', 'tax credit', 'tax break', 'abatement', 'bond', 'bonds',
  'municipal', 'council approves', 'city approves', 'city council',
  'redevelopment', 'revitalization', 'urban renewal', 'downtown',
  'mixed-use', 'development project', 'lofts', 'housing development',
  'affordable housing', 'residential', 'commercial',
  
  // Added: Airport and transportation terms
  'terminal', 'airport expansion', 'runway', 'gate', 'gates',
  'transit', 'transportation', 'passenger', 'aviation',
  'air travel', 'flight', 'airline', 'american airlines', 'southwest'
];

// Function to check if article is related to jobs using keywords
function isJobRelatedByKeywords(title, content, extraKeywords = [], excludeKeywords = []) {
  // Combine default keywords with extra keywords and remove excluded ones
  const enhancedKeywords = [
    ...jobKeywords,
    ...extraKeywords
  ].filter(kw => !excludeKeywords.includes(kw));

  const titleLower = title.toLowerCase();
  const contentLower = content.toLowerCase();
  
  // Critical keyword check in title
  const criticalKeywords = [
    'terminal', 'airport', 'council approves', 'subsidy',
    'million', 'billion', 'project', 'development',
    'construction', 'funding', 'economic', 'american airlines',
    'dfw', 'lofts', 'city council'
  ];
  
  for (const criticalTerm of criticalKeywords) {
    if (titleLower.includes(criticalTerm)) {
      if (logger) logger.info(`Critical keyword found in title: "${criticalTerm}"`);
      else console.log(`✅ Critical keyword found in title: "${criticalTerm}"`);
      return true;
    }
  }
  
  // Check if any keywords are in the title (higher weight)
  const titleMatch = enhancedKeywords.some(keyword => titleLower.includes(keyword));
  if (titleMatch) return true;
  
  // Enhanced dollar amount detection - check both title and content
  const dollarRegex = /\$\s*\d+(\.\d+)?\s*(million|billion|m|b|k)?/i;
  if (titleLower.match(dollarRegex)) {
    if (logger) logger.info('Dollar amount found in title');
    else console.log('💰 Dollar amount found in title');
    return true;
  }
  
  const firstParagraph = contentLower.split('\n\n')[0] || '';
  if (firstParagraph.match(dollarRegex)) {
    if (logger) logger.info('Dollar amount found in first paragraph');
    else console.log('💰 Dollar amount found in first paragraph');
    return true;
  }
  
  // Check for phrases related to government funding or approval
  const fundingPhrases = [
    'approves funding', 'approved funding', 
    'approves subsidy', 'approved subsidy',
    'announces investment', 'announced investment',
    'approves plan', 'approved plan',
    'receives grant', 'received grant',
    'awarded contract', 'awards contract',
    'city council vote', 'council voted'
  ];
  
  for (const phrase of fundingPhrases) {
    if (contentLower.includes(phrase)) {
      return true;
    }
  }
  
  // Special case for city council or government approvals
  if ((titleLower.includes('city') || titleLower.includes('council') || 
       titleLower.includes('mayor') || titleLower.includes('approves')) &&
      (contentLower.includes('project') || contentLower.includes('development') || 
       contentLower.includes('plan') || contentLower.includes('fund'))) {
    return true;
  }
  
  // Special case for airports (which create many jobs)
  if ((titleLower.includes('airport') || titleLower.includes('airline') || 
      titleLower.includes('american airlines') || titleLower.includes('terminal')) &&
      (contentLower.includes('new') || contentLower.includes('plan') || 
       contentLower.includes('develop') || contentLower.includes('build'))) {
    return true;
  }
  
  // Check if multiple keywords are in the content (for better accuracy)
  let keywordCount = 0;
  for (const keyword of enhancedKeywords) {
    if (contentLower.includes(keyword)) {
      keywordCount++;
      // If we find 3 or more different job-related keywords, consider it relevant
      if (keywordCount >= 3) return true;
    }
  }
  
  return false;
}

// Function to check if article is related to jobs using AI
async function isJobRelevantWithAI(title, content, openaiApiKey) {
  if (!openaiApiKey) {
    if (logger) logger.warning('No OpenAI API key found, using keyword-based filtering');
    else console.log('⚠️ No OpenAI API key found, using keyword-based filtering');
    
    return { 
      isRelevant: isJobRelatedByKeywords(title, content), 
      explanation: 'Determined by keyword matching (AI unavailable)' 
    };
  }

  try {
    // Enhanced AI prompt for relevance check
    const prompt = `
Article Title: "${title}"
Article Content:
${content.slice(0, 1000)}${content.length > 1000 ? '...' : ''}
Question: Is this article relevant to jobs, employment, economic development, or business expansion?
Consider the following criteria:
1. Does it discuss job creation, job losses, hiring, or employment trends?
2. Does it mention new businesses, facilities, or expansions that would create jobs?
3. Does it involve significant infrastructure projects (like airports, buildings, factories, terminals) that would impact employment?
4. Does it discuss economic development initiatives, business relocations, or company investments?
5. Does it mention manufacturing, production, distribution centers, logistics, or industrial facilities?
6. Does it discuss city/municipal funding, subsidies, or approval for development projects?
7. Does it mention dollar amounts for investments, developments, or economic initiatives?
8. Does it involve transportation infrastructure improvements that could create jobs?
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
        max_tokens: 150 // Keep it brief
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
    if (logger) logger.error('Error calling OpenAI API:', error.message);
    else console.error('Error calling OpenAI API:', error.message);
    
    // Default to keyword-based filtering if API fails
    return { 
      isRelevant: isJobRelatedByKeywords(title, content), 
      explanation: 'AI analysis failed, falling back to keywords' 
    };
  }
}

// Enhanced function to determine relevance using feedback and model
async function checkRelevance(article, content, feedback, relevanceModel = null, openaiApiKey = process.env.OPENAI_API_KEY) {
  const { url, title } = article;
  
  // Check explicit inclusion/exclusion first
  if (feedback.includedArticles.includes(url)) {
    return {
      isRelevant: true,
      explanation: 'Explicitly included via feedback'
    };
  }
  
  if (feedback.excludedArticles.includes(url)) {
    return {
      isRelevant: false,
      explanation: 'Explicitly excluded via feedback'
    };
  }
  
  // Apply keyword additions and removals to the content check
  const checkKeywords = () => isJobRelatedByKeywords(
    title, 
    content, 
    feedback.keywordAdditions, 
    feedback.keywordRemovals
  );
  
  // First use the model if available
  if (relevanceModel) {
    const evaluation = evaluateArticleWithModel(
      { title, content }, 
      relevanceModel
    );
    
    // High confidence in model
    if (evaluation.score >= 4) {
      return {
        isRelevant: true,
        explanation: `Strong relevance detected by model (score: ${evaluation.score.toFixed(2)})`
      };
    } else if (evaluation.score <= 1) {
      return {
        isRelevant: false,
        explanation: `Article deemed not relevant by model (score: ${evaluation.score.toFixed(2)})`
      };
    }
    
    // Model uncertainty, check keywords
    if (checkKeywords()) {
      return {
        isRelevant: true,
        explanation: `Relevant by keyword matching (model score: ${evaluation.score.toFixed(2)})`
      };
    }
  } else {
    // No model, check keywords
    if (checkKeywords()) {
      return {
        isRelevant: true,
        explanation: 'Relevant by keyword matching'
      };
    }
  }
  
  // Fall back to AI if we have a key
  if (openaiApiKey) {
    try {
      const aiResult = await isJobRelevantWithAI(title, content, openaiApiKey);
      return aiResult;
    } catch (err) {
      if (logger) logger.warning(`AI analysis failed: ${err.message}, falling back to keywords`);
      else console.log(`⚠️ AI analysis failed: ${err.message}, falling back to keywords`);
      
      return {
        isRelevant: checkKeywords(),
        explanation: 'AI failed, determined by keyword matching'
      };
    }
  }
  
  // Default to keywords if all else fails
  return {
    isRelevant: checkKeywords(),
    explanation: 'Determined by keyword matching'
  };
}

// Function to evaluate article relevance using the learned model
function evaluateArticleWithModel(article, model) {
  if (!model) {
    return { score: 0, isRelevant: false };
  }

  const title = article.title?.toLowerCase() || '';
  const content = article.content?.toLowerCase() || '';
  
  let score = 0;
  
  // Check for top title words
  model.topTitleWords.forEach(word => {
    if (title.includes(word)) {
      score += 1;
    }
  });
  
  // Check for top content phrases
  model.topContentPhrases.forEach(phrase => {
    if (content.includes(phrase)) {
      score += 0.5;
    }
  });
  
  // Check for feature importance
  if (/\$\s*\d+(\.\d+)?\s*(million|billion|m|b)?/i.test(title) || 
      /\$\s*\d+(\.\d+)?\s*(million|billion|m|b)?/i.test(content.substring(0, 500))) {
    score += 3 * model.featureImportance.dollarAmounts;
  }
  
  if (/city|dallas|fort worth|plano|arlington|frisco/i.test(title)) {
    score += 2 * model.featureImportance.cityMentions;
  }
  
  if (/project|development|construct|build|expansion/i.test(title)) {
    score += 2 * model.featureImportance.infrastructureProjects;
  }
  
  if (/approve|council|vote|plan|subsidy|funding/i.test(title)) {
    score += 3 * model.featureImportance.governmentApprovals;
  }
  
  return {
    score,
    isRelevant: score >= 3 // Threshold for relevance
  };
}

// Create and export a singleton object with all functions
const relevanceChecker = {
  isJobRelatedByKeywords,
  isJobRelevantWithAI,
  checkRelevance,
  evaluateArticleWithModel,
  // For backward compatibility
  determineRelevance: checkRelevance
};

// Export as default
export default relevanceChecker;
