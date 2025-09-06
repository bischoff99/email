const express = require('express');
const ClaudeAIService = require('../../core/aiService');
const HuggingFaceAIService = require('../../core/huggingfaceService');
const OpenAIService = require('../../core/openaiService');
const HostingerEmailClient = require('../../core/emailClient');
const config = require('../../core/config');

const router = express.Router();

// Initialize AI services with priority: OpenAI > Hugging Face > Claude
let primaryAI, fallbackAI;
if (process.env.OPENAI_API_KEY) {
  primaryAI = new OpenAIService();
  fallbackAI = new HuggingFaceAIService();
  console.log('🚀 Using OpenAI GPT-4 as primary AI service');
  console.log('🛡️ Hugging Face with local intelligence as fallback');
} else if (process.env.HUGGINGFACE_API_TOKEN) {
  primaryAI = new HuggingFaceAIService();
  fallbackAI = null;
  console.log('✅ Using Hugging Face AI service with local intelligence');
} else if (process.env.ANTHROPIC_API_KEY) {
  primaryAI = new ClaudeAIService(process.env.ANTHROPIC_API_KEY);
  fallbackAI = null;
  console.log('✅ Using Anthropic Claude AI service');
} else {
  primaryAI = new HuggingFaceAIService(); // Always available with local intelligence
  fallbackAI = null;
  console.log('🛡️ Using intelligent local analysis system');
}

// Create unified AI service with automatic fallback
const aiService = {
  async callWithFallback(method, ...args) {
    try {
      if (primaryAI && primaryAI.isEnabled()) {
        return await primaryAI[method](...args);
      }
    } catch (error) {
      console.error(`Primary AI (${primaryAI.constructor.name}) failed:`, error.message);
      if (fallbackAI) {
        console.log('🔄 Falling back to secondary AI provider');
        try {
          return await fallbackAI[method](...args);
        } catch (fallbackError) {
          console.error(`Fallback AI failed:`, fallbackError.message);
          throw fallbackError;
        }
      }
      throw error;
    }
    
    // If primary is not enabled, use fallback or local intelligence
    if (fallbackAI) {
      return await fallbackAI[method](...args);
    }
    
    throw new Error('No AI services available');
  },
  
  async analyzeEmail(...args) { return this.callWithFallback('analyzeEmail', ...args); },
  async generateEmailResponse(...args) { return this.callWithFallback('generateEmailResponse', ...args); },
  async extractActionItems(...args) { return this.callWithFallback('extractActionItems', ...args); },
  async categorizeEmails(...args) { return this.callWithFallback('categorizeEmails', ...args); },
  async summarizeEmailThread(...args) { return this.callWithFallback('summarizeEmailThread', ...args); },
  
  isEnabled() {
    return (primaryAI && primaryAI.isEnabled()) || (fallbackAI && fallbackAI.isEnabled()) || true; // Always true due to local intelligence
  },
  
  getStatus() {
    const status = {
      success: true,
      aiEnabled: true,
      primaryProvider: null,
      fallbackProvider: null,
      availableModels: {},
      features: [
        'Email Analysis',
        'Response Generation', 
        'Email Categorization',
        'Action Items Extraction',
        'Thread Summarization',
        'Sentiment Analysis',
        'Language Detection',
        'Smart Processing'
      ],
      availableProviders: {
        openai: !!process.env.OPENAI_API_KEY,
        huggingface: !!process.env.HUGGINGFACE_API_TOKEN,
        claude: !!process.env.ANTHROPIC_API_KEY,
        local_intelligence: true
      },
      timestamp: new Date().toISOString()
    };
    
    if (primaryAI instanceof OpenAIService && primaryAI.isEnabled()) {
      status.primaryProvider = 'OpenAI GPT-4';
      status.availableModels = {
        fast: 'gpt-3.5-turbo',
        smart: 'gpt-4o-mini',
        premium: 'gpt-4o'
      };
    } else if (primaryAI instanceof HuggingFaceAIService) {
      status.primaryProvider = 'Hugging Face + Local Intelligence';
      status.availableModels = {
        fast: 'local-intelligent-analysis',
        smart: 'local-intelligent-analysis',
        premium: 'local-intelligent-analysis'
      };
    } else {
      status.primaryProvider = 'Intelligent Local Analysis';
    }
    
    if (fallbackAI) {
      status.fallbackProvider = 'Hugging Face + Local Intelligence';
    }
    
    return status;
  }
};

// Middleware to check if AI service is enabled (always passes due to local intelligence)
const requireAI = (req, res, next) => {
  if (!aiService.isEnabled()) {
    return res.status(503).json({
      success: false,
      error: 'AI service is not available. This should not happen with local intelligence.',
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
  res.json(aiService.getStatus());
});

module.exports = router;