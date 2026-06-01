// Cloudflare Workers API for Hybrid Translation Service
// Routes between Google Translate and Claude based on content complexity

import { TranslationService } from '../translation-service.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (url.pathname === '/api/translate' && request.method === 'POST') {
        return await handleTranslation(request, env, corsHeaders);
      }
      
      if (url.pathname === '/api/translate/batch' && request.method === 'POST') {
        return await handleBatchTranslation(request, env, corsHeaders);
      }

      if (url.pathname === '/api/translate/cost-estimate' && request.method === 'POST') {
        return await handleCostEstimate(request, env, corsHeaders);
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error('Translation API error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }
};

async function handleTranslation(request, env, corsHeaders) {
  const { text, toolType = 'default', sourceLang = 'pt', targetLang = 'en' } = await request.json();
  
  if (!text) {
    return new Response(
      JSON.stringify({ error: 'Text is required' }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const translationService = new TranslationService();
  translationService.googleApiKey = env.GOOGLE_TRANSLATE_API_KEY;
  translationService.claudeApiKey = env.CLAUDE_API_KEY;

  try {
    const translation = await translationService.translate(text, toolType);
    const costEstimate = translationService.getCostEstimate(text, toolType);
    
    return new Response(
      JSON.stringify({
        translation,
        toolType,
        service: costEstimate.service,
        estimatedCost: costEstimate.estimatedCost,
        characters: costEstimate.characters
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Translation error:', error);
    return new Response(
      JSON.stringify({ error: 'Translation failed', details: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleBatchTranslation(request, env, corsHeaders) {
  const { texts, toolType = 'default' } = await request.json();
  
  if (!Array.isArray(texts) || texts.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Texts array is required' }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (texts.length > 10) {
    return new Response(
      JSON.stringify({ error: 'Maximum 10 texts per batch' }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const translationService = new TranslationService();
  translationService.googleApiKey = env.GOOGLE_TRANSLATE_API_KEY;
  translationService.claudeApiKey = env.CLAUDE_API_KEY;

  try {
    const results = await translationService.translateBatch(texts, toolType);
    
    return new Response(
      JSON.stringify({
        results,
        totalTexts: texts.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Batch translation error:', error);
    return new Response(
      JSON.stringify({ error: 'Batch translation failed', details: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleCostEstimate(request, env, corsHeaders) {
  const { text, toolType = 'default' } = await request.json();
  
  if (!text) {
    return new Response(
      JSON.stringify({ error: 'Text is required' }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const translationService = new TranslationService();
  const costEstimate = translationService.getCostEstimate(text, toolType);
  
  return new Response(
    JSON.stringify(costEstimate),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
