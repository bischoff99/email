// Multi-provider AI service supporting various free AI APIs
class MultiAIService {
  constructor(providers = {}) {
    this.providers = providers;
    this.enabledProviders = [];
    
    // Initialize available providers
    this.initializeProviders();
  }

  initializeProviders() {
    // Check Groq (free and fast)
    if (process.env.GROQ_API_KEY) {
      this.enabledProviders.push({
        name: 'groq',
        type: 'groq',
        models: ['llama3-70b-8192', 'mixtral-8x7b-32768'],
        priority: 1 // Highest priority (fastest)
      });
    }

    // Check OpenAI (has free tier)
    if (process.env.OPENAI_API_KEY) {
      this.enabledProviders.push({
        name: 'openai',
        type: 'openai', 
        models: ['gpt-3.5-turbo', 'gpt-4o-mini'],
        priority: 2
      });
    }

    // Check Anthropic Claude (your current setup)
    if (process.env.ANTHROPIC_API_KEY) {
      this.enabledProviders.push({
        name: 'claude',
        type: 'anthropic',
        models: ['claude-3-5-haiku-20241022', 'claude-3-5-sonnet-20241022'],
        priority: 3
      });
    }

    // Check Google Gemini (has free tier)
    if (process.env.GEMINI_API_KEY) {
      this.enabledProviders.push({
        name: 'gemini',
        type: 'google',
        models: ['gemini-2.5-pro', 'gemini-2.5-flash'],
        priority: 4
      });
    }

    // Sort by priority (lower number = higher priority)
    this.enabledProviders.sort((a, b) => a.priority - b.priority);

    if (this.enabledProviders.length === 0) {
      console.warn('⚠️ No AI providers configured. Available free options:');
      console.warn('💡 Groq: https://console.groq.com/ (fastest, free)');
      console.warn('💡 OpenAI: https://platform.openai.com/ (has free tier)');
      console.warn('💡 Google Gemini: https://ai.google.dev/ (generous free tier)');
      console.warn('💡 Anthropic Claude: https://console.anthropic.com/ (pay per use)');
    } else {
      console.log(`✅ AI providers available: ${this.enabledProviders.map(p => p.name).join(', ')}`);
    }
  }

  isEnabled() {
    return this.enabledProviders.length > 0;
  }

  getAvailableProviders() {
    return this.enabledProviders;
  }

  async analyzeEmail(emailContent, options = {}) {
    if (!this.isEnabled()) {
      return {
        success: false,
        error: 'No AI providers available',
        suggestion: 'Configure at least one AI provider (Groq, OpenAI, Claude, or Gemini)'
      };
    }

    const provider = this.enabledProviders[0]; // Use highest priority provider

    try {
      switch (provider.type) {
        case 'groq':
          return await this.analyzeWithGroq(emailContent, options);
        case 'openai':
          return await this.analyzeWithOpenAI(emailContent, options);
        case 'anthropic':
          return await this.analyzeWithClaude(emailContent, options);
        case 'google':
          return await this.analyzeWithGemini(emailContent, options);
        default:
          throw new Error(`Unsupported provider: ${provider.type}`);
      }
    } catch (error) {
      console.error(`AI Analysis failed with ${provider.name}:`, error.message);
      
      // Try fallback provider if available
      if (this.enabledProviders.length > 1) {
        console.log('Trying fallback provider...');
        const fallbackProvider = this.enabledProviders[1];
        try {
          return await this.analyzeWithProvider(fallbackProvider, emailContent, options);
        } catch (fallbackError) {
          return {
            success: false,
            error: `All providers failed. Primary: ${error.message}, Fallback: ${fallbackError.message}`
          };
        }
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  async analyzeWithGroq(emailContent, options) {
    // Groq uses OpenAI-compatible API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [{
          role: 'user',
          content: this.buildAnalysisPrompt(emailContent, options.analysisType)
        }],
        temperature: 0.1,
        max_tokens: options.analysisType === 'quick' ? 500 : 1500
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const result = data.choices[0].message.content;

    return {
      success: true,
      analysis: this.parseAIResponse(result),
      provider: 'groq',
      model: 'llama3-70b-8192',
      usage: data.usage
    };
  }

  async analyzeWithOpenAI(emailContent, options) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: this.buildAnalysisPrompt(emailContent, options.analysisType)
        }],
        temperature: 0.1,
        max_tokens: options.analysisType === 'quick' ? 500 : 1500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const result = data.choices[0].message.content;

    return {
      success: true,
      analysis: this.parseAIResponse(result),
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      usage: data.usage
    };
  }

  async analyzeWithGemini(emailContent, options) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: this.buildAnalysisPrompt(emailContent, options.analysisType)
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: options.analysisType === 'quick' ? 500 : 1500
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const result = data.candidates[0].content.parts[0].text;

    return {
      success: true,
      analysis: this.parseAIResponse(result),
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      usage: data.usageMetadata
    };
  }

  async analyzeWithClaude(emailContent, options) {
    // Use existing Claude service
    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: options.analysisType === 'quick' ? 500 : 1500,
      temperature: 0.1,
      messages: [{
        role: 'user',
        content: this.buildAnalysisPrompt(emailContent, options.analysisType)
      }]
    });

    return {
      success: true,
      analysis: this.parseAIResponse(response.content[0].text),
      provider: 'claude',
      model: response.model,
      usage: response.usage
    };
  }

  buildAnalysisPrompt(emailContent, analysisType = 'comprehensive') {
    const basePrompt = `Analyze this email and return only valid JSON:\n\nEmail: ${emailContent}\n\n`;
    
    switch (analysisType) {
      case 'quick':
        return basePrompt + `Return JSON: {"category": "support/sales/general/urgent", "priority": "high/medium/low", "sentiment": "positive/neutral/negative", "summary": "brief summary"}`;
      
      case 'security':
        return basePrompt + `Check for security issues. Return JSON: {"is_safe": true/false, "threats": ["phishing", "spam"], "risk_level": "high/medium/low", "details": "explanation"}`;
      
      default:
        return basePrompt + `Return JSON: {"category": "support/sales/general/urgent", "priority": "high/medium/low", "sentiment": "positive/neutral/negative", "key_topics": ["topic1"], "action_items": ["action1"], "summary": "brief summary", "requires_human_review": true/false}`;
    }
  }

  parseAIResponse(response) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        return JSON.parse(response);
      }
    } catch {
      // Fallback if JSON parsing fails
      return {
        category: 'general',
        priority: 'medium',
        sentiment: 'neutral',
        summary: 'AI analysis available but parsing failed',
        raw_response: response
      };
    }
  }

  async generateResponse(originalEmail, context = '', tone = 'professional') {
    if (!this.isEnabled()) {
      return {
        success: false,
        error: 'No AI providers available'
      };
    }

    const provider = this.enabledProviders[0];
    const prompt = `Generate a ${tone} email response to: ${originalEmail}\n\nContext: ${context}\n\nResponse:`;

    try {
      switch (provider.type) {
        case 'groq':
          return await this.generateWithGroq(prompt);
        case 'openai':
          return await this.generateWithOpenAI(prompt);
        case 'anthropic':
          return await this.generateWithClaude(prompt);
        case 'google':
          return await this.generateWithGemini(prompt);
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: provider.name
      };
    }
  }

  async generateWithGroq(prompt) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    return {
      success: true,
      response: data.choices[0].message.content,
      provider: 'groq'
    };
  }

  // Add similar methods for other providers...
  async generateWithOpenAI(prompt) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    return {
      success: true,
      response: data.choices[0].message.content,
      provider: 'openai'
    };
  }
}

module.exports = MultiAIService;