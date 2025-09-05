const express = require('express');
const ClaudeAIService = require('../../core/aiService');
const HuggingFaceAIService = require('../../core/huggingfaceService');
const HostingerEmailClient = require('../../core/emailClient');
const config = require('../../core/config');

const router = express.Router();

// Initialize AI services with priority: Hugging Face > Claude
let aiService;
if (process.env.HUGGINGFACE_API_TOKEN) {
  aiService = new HuggingFaceAIService(process.env.HUGGINGFACE_API_TOKEN);
  console.log('✅ Using Hugging Face AI service (Pro account)');
} else if (process.env.ANTHROPIC_API_KEY) {
  aiService = new ClaudeAIService(process.env.ANTHROPIC_API_KEY);
  console.log('✅ Using Anthropic Claude AI service');
} else {
  aiService = { isEnabled: () => false };
  console.warn('⚠️ No AI services available');
}

// Middleware to check if AI service is enabled
const requireAI = (req, res, next) => {
  if (!aiService.isEnabled()) {
    return res.status(503).json({
      success: false,
      error: 'AI service is not available. Please configure ANTHROPIC_API_KEY.',
      code: 'AI_SERVICE_DISABLED'
    });
  }
  next();
};

// AI Email Analysis Endpoint
router.post('/analyze-email', requireAI, async (req, res) => {
  const logger = req.app.locals.logger;
  
  try {
    const { emailContent, analysisType = 'comprehensive', includeResponse = false } = req.body;
    
    if (!emailContent) {
      return res.status(400).json({
        success: false,
        error: 'emailContent is required'
      });
    }

    logger.info('AI email analysis requested', {
      analysisType,
      contentLength: emailContent.length
    });

    const result = await aiService.analyzeEmail(emailContent, {
      analysisType,
      includeResponse
    });

    if (result.success) {
      logger.info('AI email analysis completed', {
        category: result.analysis.category,
        priority: result.analysis.priority,
        modelUsed: result.model_used
      });
    }

    res.json(result);

  } catch (error) {
    logger.error('AI email analysis error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error during AI analysis'
    });
  }
});

// AI Response Generation Endpoint
router.post('/generate-response', requireAI, async (req, res) => {
  const logger = req.app.locals.logger;
  
  try {
    const { originalEmail, context = '', tone = 'professional' } = req.body;
    
    if (!originalEmail) {
      return res.status(400).json({
        success: false,
        error: 'originalEmail is required'
      });
    }

    logger.info('AI response generation requested', {
      tone,
      contextLength: context.length
    });

    const result = await aiService.generateEmailResponse(originalEmail, context, tone);

    if (result.success) {
      logger.info('AI response generated', {
        responseLength: result.response.length,
        modelUsed: result.model_used
      });
    }

    res.json(result);

  } catch (error) {
    logger.error('AI response generation error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error during response generation'
    });
  }
});

// AI Email Categorization Endpoint
router.post('/categorize-emails', requireAI, async (req, res) => {
  const logger = req.app.locals.logger;
  
  try {
    const { emails, senderEmail } = req.body;
    let emailsToProcess = emails;

    // If senderEmail is provided but no emails, fetch from email client
    if (!emails && senderEmail) {
      const emailClient = new HostingerEmailClient(config.email);
      
      try {
        await emailClient.connect();
        emailsToProcess = await emailClient.getLatestFromSender(senderEmail, 10);
        emailClient.disconnect();
      } catch (emailError) {
        logger.error('Failed to fetch emails for categorization', { error: emailError.message });
        return res.status(400).json({
          success: false,
          error: 'Failed to fetch emails from sender'
        });
      }
    }

    if (!emailsToProcess || !Array.isArray(emailsToProcess) || emailsToProcess.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'emails array is required and must contain at least one email'
      });
    }

    logger.info('AI email categorization requested', {
      emailCount: emailsToProcess.length
    });

    const results = await aiService.categorizeEmails(emailsToProcess);

    const successful = results.filter(r => r.success).length;
    logger.info('AI email categorization completed', {
      totalEmails: emailsToProcess.length,
      successful: successful,
      failed: emailsToProcess.length - successful
    });

    res.json({
      success: true,
      results: results,
      summary: {
        total: emailsToProcess.length,
        successful: successful,
        failed: emailsToProcess.length - successful
      }
    });

  } catch (error) {
    logger.error('AI email categorization error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error during email categorization'
    });
  }
});

// AI Action Items Extraction Endpoint
router.post('/extract-actions', requireAI, async (req, res) => {
  const logger = req.app.locals.logger;
  
  try {
    const { emailContent } = req.body;
    
    if (!emailContent) {
      return res.status(400).json({
        success: false,
        error: 'emailContent is required'
      });
    }

    logger.info('AI action items extraction requested');

    const result = await aiService.extractActionItems(emailContent);

    if (result.success) {
      logger.info('AI action items extracted', {
        actionItemsCount: result.data.action_items.length,
        hasDeadlines: result.data.has_deadlines,
        urgentItems: result.data.urgent_items.length
      });
    }

    res.json(result);

  } catch (error) {
    logger.error('AI action items extraction error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error during action items extraction'
    });
  }
});

// AI Email Thread Summarization Endpoint
router.post('/summarize-thread', requireAI, async (req, res) => {
  const logger = req.app.locals.logger;
  
  try {
    const { emails, senderEmail } = req.body;
    let emailsToProcess = emails;

    // If senderEmail is provided but no emails, fetch email thread
    if (!emails && senderEmail) {
      const emailClient = new HostingerEmailClient(config.email);
      
      try {
        await emailClient.connect();
        emailsToProcess = await emailClient.getLatestFromSender(senderEmail, 20);
        emailClient.disconnect();
      } catch (emailError) {
        logger.error('Failed to fetch email thread for summarization', { error: emailError.message });
        return res.status(400).json({
          success: false,
          error: 'Failed to fetch email thread from sender'
        });
      }
    }

    if (!emailsToProcess || !Array.isArray(emailsToProcess) || emailsToProcess.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'emails array is required and must contain at least one email'
      });
    }

    logger.info('AI email thread summarization requested', {
      threadLength: emailsToProcess.length
    });

    const result = await aiService.summarizeEmailThread(emailsToProcess);

    if (result.success) {
      logger.info('AI email thread summarized', {
        threadLength: result.thread_length,
        summaryLength: result.summary.length
      });
    }

    res.json(result);

  } catch (error) {
    logger.error('AI email thread summarization error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error during thread summarization'
    });
  }
});

// Combined AI Analysis Endpoint (analyze + generate response)
router.post('/smart-process', requireAI, async (req, res) => {
  const logger = req.app.locals.logger;
  
  try {
    const { emailContent, generateResponse = false, tone = 'professional' } = req.body;
    
    if (!emailContent) {
      return res.status(400).json({
        success: false,
        error: 'emailContent is required'
      });
    }

    logger.info('AI smart email processing requested', { generateResponse });

    // First, analyze the email
    const analysis = await aiService.analyzeEmail(emailContent, {
      analysisType: 'comprehensive'
    });

    const result = {
      analysis: analysis,
      response: null
    };

    // Generate response if requested
    if (generateResponse && analysis.success) {
      const responseGeneration = await aiService.generateEmailResponse(emailContent, '', tone);
      result.response = responseGeneration;
    }

    logger.info('AI smart email processing completed', {
      analysisSuccess: analysis.success,
      responseGenerated: generateResponse && result.response?.success
    });

    res.json({
      success: true,
      result: result
    });

  } catch (error) {
    logger.error('AI smart email processing error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error during smart processing'
    });
  }
});

// Enhanced AI Service Status Endpoint
router.get('/status', (req, res) => {
  let provider = 'none';
  let models = null;
  let features = [];

  if (aiService.isEnabled()) {
    if (process.env.HUGGINGFACE_API_TOKEN) {
      provider = 'huggingface';
      models = aiService.models;
      features = [
        'Email Analysis',
        'Response Generation', 
        'Email Categorization',
        'Action Items Extraction',
        'Thread Summarization',
        'Sentiment Analysis',
        'Language Detection',
        'Smart Processing'
      ];
    } else if (process.env.ANTHROPIC_API_KEY) {
      provider = 'claude';
      models = aiService.models;
      features = [
        'Email Analysis',
        'Response Generation', 
        'Email Categorization',
        'Action Items Extraction',
        'Thread Summarization',
        'Smart Processing'
      ];
    }
  }

  res.json({
    success: true,
    aiEnabled: aiService.isEnabled(),
    provider: provider,
    availableModels: models,
    features: features,
    availableProviders: {
      huggingface: !!process.env.HUGGINGFACE_API_TOKEN,
      claude: !!process.env.ANTHROPIC_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;