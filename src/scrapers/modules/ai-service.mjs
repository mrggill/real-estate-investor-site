// src/scrapers/modules/ai-service.mjs
import axios from 'axios';
import logger from '../utils/logger.mjs';

class AiService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.enabled = !!this.apiKey && process.env.ENABLE_AI !== 'false';
    this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
  }

  /**
   * Check if AI services are enabled
   * @returns {boolean} - True if API key is configured and AI is enabled
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Make a request to the OpenAI API
   * @param {string} prompt - The prompt to send to the API
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - The API response text
   */
  async makeRequest(prompt, options = {}) {
    if (!this.isEnabled()) {
      throw new Error('AI service is not enabled');
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: options.model || this.model,
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: options.temperature !== undefined ? options.temperature : 0.7,
          max_tokens: options.maxTokens || 150
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      logger.error('OpenAI API request failed', error);
      throw new Error(`AI request failed: ${error.message}`);
    }
  }

  /**
   * Check if an article is relevant to jobs using AI
   * @param {string} title - Article title
   * @param {string} content - Article content
   * @returns {Promise<Object>} - Relevance result with explanation
   */
  async checkArticleRelevance(title, content) {
    if (!this.isEnabled()) {
      logger.warning('AI service not enabled, using keyword-based filtering');
      return { 
        isRelevant: false, 
        explanation: 'AI service not available, using alternatives',
        aiUsed: false
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

      const aiResponse = await this.makeRequest(prompt, {
        temperature: 0.3, // Lower temperature for more consistent responses
        maxTokens: 150    // Keep it brief
      });
      
      // Extract the Yes/No answer
      const isRelevant = aiResponse.toLowerCase().startsWith('yes');
      
      return {
        isRelevant,
        explanation: aiResponse.replace(/^(yes|no)[.,: ]*/i, '').trim(),
        aiUsed: true
      };
    } catch (error) {
      logger.error('AI relevance check failed', error);
      return { 
        isRelevant: false, 
        explanation: 'AI analysis failed',
        aiUsed: false
      };
    }
  }

  /**
   * Correct grammatical errors in text using AI
   * @param {string} text - Text to correct
   * @returns {Promise<string>} - Corrected text
   */
  async correctGrammar(text) {
    if (!this.isEnabled()) {
      logger.warning('AI service not enabled, skipping grammar correction');
      return text;
    }

    try {
      // Prepare a prompt for the AI
      const prompt = `
Correct any spelling, grammatical errors, or typos in the following text. If there are no errors, return the original text unchanged:
"${text}"
Only return the corrected text, with no additional comments or explanations.
`;

      const correctedText = await this.makeRequest(prompt, {
        temperature: 0.0, // Use zero temperature for consistent corrections
        maxTokens: 100    // Keep it brief
      });
      
      // Only return the corrected text if it's different from the original
      if (correctedText !== text) {
        logger.info(`Grammar corrected: "${text}" → "${correctedText}"`);
      }
      
      return correctedText;
    } catch (error) {
      logger.error('Grammar correction failed', error);
      return text; // Return the original text if correction fails
    }
  }

  /**
   * Generate a summary of content using AI
   * @param {string} content - Content to summarize
   * @returns {Promise<string|null>} - Generated summary or null if failed
   */
  async generateSummary(content) {
    if (!this.isEnabled()) {
      logger.warning('AI service not enabled, skipping summary generation');
      return null;
    }

    try {
      const prompt = `Summarize this news article in one sentence: ${content.slice(0, 2000)}`;
      
      const summary = await this.makeRequest(prompt, {
        temperature: 0.7,
        maxTokens: 100
      });
      
      logger.info('AI summary generated successfully');
      return summary;
    } catch (error) {
      logger.error('Summary generation failed', error);
      return null;
    }
  }
}

// Create and export a singleton instance
const aiService = new AiService();
export default aiService;
