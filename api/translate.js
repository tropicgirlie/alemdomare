// Vercel Serverless Function for Translation API
// Handles hybrid translation with ChatGPT + Claude

import { TranslationService } from '../translation-service.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { text, toolType = 'default', sourceLang = 'pt', targetLang = 'en' } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      const translationService = new TranslationService();
      translationService.openaiApiKey = process.env.OPENAI_API_KEY;
      translationService.claudeApiKey = process.env.CLAUDE_API_KEY;

      const translation = await translationService.translate(text, toolType);
      const costEstimate = translationService.getCostEstimate(text, toolType);
      
      return res.status(200).json({
        translation,
        toolType,
        service: costEstimate.service,
        estimatedCost: costEstimate.estimatedCost,
        characters: costEstimate.characters
      });
    } catch (error) {
      console.error('Translation error:', error);
      return res.status(500).json({ 
        error: 'Translation failed', 
        details: error.message 
      });
    }
  }

  return res.status(404).json({ error: 'Not found' });
}
