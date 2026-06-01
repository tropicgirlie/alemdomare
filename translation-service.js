// Hybrid Translation Service - ChatGPT + Claude
// Routes to cheapest reliable option based on content complexity

class TranslationService {
  constructor() {
    this.openaiApiKey = null; // Set this in Cloudflare Worker env
    this.claudeApiKey = null; // Set this in Cloudflare Worker env
  }

  // Determine if content needs Claude (premium) vs ChatGPT (basic)
  needsPremiumTranslation(toolType, content) {
    const careerTools = ['career', 'cultural', 'identity_reframe', 'say_it_better'];
    const complexKeywords = ['carreira', 'experiência', 'profissional', 'cultura', 'adaptar'];
    
    // Use Claude for career/cultural tools (most complex)
    if (careerTools.includes(toolType)) {
      return true;
    }
    
    // Use Claude for content with career-related keywords
    const hasComplexKeywords = complexKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );
    
    // Use Claude for longer content (likely nuanced)
    const isLongContent = content.length > 300;
    
    return hasComplexKeywords || isLongContent;
  }

  // ChatGPT API for basic translations
  async translateWithChatGPT(text, toolType = 'default') {
    try {
      const prompt = this.getChatGPTPrompt(text, toolType);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{
            role: 'system',
            content: 'You are a professional translation specialist. Provide accurate, natural translations that maintain the original meaning and tone.'
          }, {
            role: 'user',
            content: prompt
          }],
          max_tokens: 1000,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`ChatGPT API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('ChatGPT translation error:', error);
      throw error;
    }
  }

  // Claude API for complex translations
  async translateWithClaude(text, toolType) {
    try {
      const prompt = this.getClaudePrompt(text, toolType);
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error('Claude translation error:', error);
      throw error;
    }
  }

  // Get appropriate ChatGPT prompt based on tool type
  getChatGPTPrompt(text, toolType) {
    const prompts = {
      career: `Convert this Brazilian professional experience into clear, impactful English for European recruiters. Focus on results, metrics, and professional language. Return only the translated text:\n\n${text}`,
      cultural: `Convert this Brazilian professional behavior context for UK/European workplace understanding. Maintain professionalism while adapting cultural nuances. Return only the translated text:\n\n${text}`,
      identity_reframe: `Help reframe this professional identity challenge for international career transition. Provide constructive, empowering guidance in English. Return only the response:\n\n${text}`,
      say_it_better: `Rewrite this message in clear, professional English suitable for the workplace. Return only the improved text:\n\n${text}`,
      default: `Translate this Brazilian Portuguese text to professional English, maintaining context and nuance. Return only the translation:\n\n${text}`
    };

    return prompts[toolType] || prompts.default;
  }

  // Get appropriate Claude prompt based on tool type
  getClaudePrompt(text, toolType) {
    const prompts = {
      career: `You are a career translation specialist. Convert this Brazilian professional experience into clear, impactful English for European recruiters. Focus on results, metrics, and professional language:\n\n${text}`,
      cultural: `You are a cultural adaptation specialist. Convert this Brazilian professional behavior context for UK/European workplace understanding. Maintain professionalism while adapting cultural nuances:\n\n${text}`,
      identity_reframe: `You are a career identity specialist. Help reframe this professional identity challenge for international career transition. Provide constructive, empowering guidance:\n\n${text}`,
      say_it_better: `You are a professional communication specialist. Rewrite this message in clear, professional English suitable for the workplace:\n\n${text}`,
      default: `Translate this Brazilian Portuguese text to professional English, maintaining context and nuance:\n\n${text}`
    };

    return prompts[toolType] || prompts.default;
  }

  // Main translation method with smart routing
  async translate(text, toolType = 'default') {
    try {
      // Route to appropriate service
      if (this.needsPremiumTranslation(toolType, text)) {
        console.log(`Using Claude for ${toolType} - complex content`);
        return await this.translateWithClaude(text, toolType);
      } else {
        console.log(`Using ChatGPT for ${toolType} - basic content`);
        return await this.translateWithChatGPT(text, toolType);
      }
    } catch (error) {
      console.error('Translation service error:', error);
      
      // Fallback: try the other service if primary fails
      if (this.needsPremiumTranslation(toolType, text)) {
        console.log('Claude failed, falling back to ChatGPT');
        return await this.translateWithChatGPT(text, toolType);
      } else {
        console.log('ChatGPT failed, falling back to Claude');
        return await this.translateWithClaude(text, toolType);
      }
    }
  }

  // Batch translation for multiple texts
  async translateBatch(texts, toolType = 'default') {
    const results = [];
    
    for (const text of texts) {
      try {
        const translation = await this.translate(text, toolType);
        results.push({ success: true, translation, original: text });
      } catch (error) {
        results.push({ success: false, error: error.message, original: text });
      }
    }
    
    return results;
  }

  // Get cost estimate for translation
  getCostEstimate(text, toolType) {
    const usesPremium = this.needsPremiumTranslation(toolType, text);
    const charCount = text.length;
    
    if (usesPremium) {
      // Claude pricing: ~$3 per 1M characters (rough estimate)
      return {
        service: 'Claude',
        estimatedCost: (charCount / 1000000) * 3,
        characters: charCount
      };
    } else {
      // ChatGPT pricing: ~$0.50 per 1M tokens (rough estimate)
      return {
        service: 'ChatGPT',
        estimatedCost: (charCount / 1000000) * 0.50,
        characters: charCount
      };
    }
  }
}

// Export for use in Cloudflare Worker
module.exports = TranslationService;
