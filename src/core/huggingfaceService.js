const { HfInference } = require('@huggingface/inference');

class HuggingFaceAIService {
  constructor(apiToken) {
    if (!apiToken) {
      console.warn('⚠️ HUGGINGFACE_API_TOKEN not provided - Hugging Face AI features will be disabled');
      this.enabled = false;
      return;
    }
    
    this.hf = new HfInference(apiToken);
    this.enabled = true;
    
    // Available models with Hugging Face Pro
    this.models = {
      fast: 'microsoft/DialoGPT-medium', // Fast for simple tasks
      smart: 'meta-llama/Llama-2-70b-chat-hf', // High quality for complex analysis
      coding: 'codellama/CodeLlama-34b-Instruct-hf', // Specialized for code
      multilingual: 'google/flan-t5-xxl' // Good for multiple languages
    };
    
    console.log('✅ Hugging Face AI service initialized with Pro account features');
  }

  isEnabled() {
    return this.enabled;
  }

  async analyzeEmail(emailContent, options = {}) {
    if (!this.enabled) {
      throw new Error('Hugging Face AI service is disabled - missing HUGGINGFACE_API_TOKEN');
    }

    const {
      model = this.models.smart,
      analysisType = 'comprehensive'
    } = options;

    let prompt = this.buildAnalysisPrompt(emailContent, analysisType);

    try {
      // Use text generation for analysis
      const response = await this.hf.textGeneration({
        model: model,
        inputs: prompt,
        parameters: {
          max_new_tokens: analysisType === 'quick' ? 300 : 800,
          temperature: 0.1,
          do_sample: true,
          return_full_text: false
        }
      });

      let analysis;
      try {
        // Try to extract JSON from response
        const jsonMatch = response.generated_text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        // Fallback analysis if JSON parsing fails
        analysis = this.extractAnalysisFromText(response.generated_text);
      }

      return {
        success: true,
        analysis: analysis,
        model_used: model,
        provider: 'huggingface',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Hugging Face AI Analysis Error:', error);
      return {
        success: false,
        error: error.message,
        fallback_analysis: {
          category: 'general',
          priority: 'medium',
          sentiment: 'neutral',
          summary: 'AI analysis unavailable'
        }
      };
    }
  }

  async generateEmailResponse(originalEmail, context = '', tone = 'professional') {
    if (!this.enabled) {
      throw new Error('Hugging Face AI service is disabled - missing HUGGINGFACE_API_TOKEN');
    }

    const prompt = `Generate a ${tone} email response to the following email.

Original Email:
${originalEmail}

Additional Context: ${context}

Guidelines:
- Be helpful and professional
- Address the sender's main concerns
- Keep it concise but thorough
- Use appropriate tone (${tone})
- Include appropriate greetings and closings

Response:`;

    try {
      const response = await this.hf.textGeneration({
        model: this.models.smart,
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.3,
          do_sample: true,
          return_full_text: false
        }
      });

      return {
        success: true,
        response: response.generated_text.trim(),
        model_used: this.models.smart,
        provider: 'huggingface'
      };

    } catch (error) {
      console.error('Email Response Generation Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async categorizeEmails(emails) {
    if (!this.enabled) {
      throw new Error('Hugging Face AI service is disabled - missing HUGGINGFACE_API_TOKEN');
    }

    // Process emails in batches to manage API limits
    const batchSize = 5;
    const results = [];

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const batchPromises = batch.map((email, index) => 
        this.analyzeEmail(`Subject: ${email.subject}\n\nFrom: ${email.from?.text || email.from}\n\nContent: ${email.text || email.html}`, {
          analysisType: 'quick',
          model: this.models.fast
        }).then(result => ({
          ...result,
          emailIndex: i + index,
          email: email
        })).catch(error => ({
          success: false,
          emailIndex: i + index,
          email: email,
          error: error.message,
          fallback_analysis: {
            category: 'general',
            priority: 'medium',
            summary: 'AI categorization failed'
          }
        }))
      );

      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Rate limiting delay between batches
        if (i + batchSize < emails.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`Batch categorization error for batch starting at ${i}:`, error);
      }
    }

    return results;
  }

  async extractActionItems(emailContent) {
    if (!this.enabled) {
      throw new Error('Hugging Face AI service is disabled - missing HUGGINGFACE_API_TOKEN');
    }

    const prompt = `Extract action items, deadlines, and tasks from this email. Return as JSON format.

Email:
${emailContent}

Please identify:
1. Specific tasks or action items
2. Any deadlines mentioned
3. Priority levels
4. Who should do what

Return JSON format:
{
  "action_items": [
    {
      "task": "description",
      "deadline": "date or 'none'",
      "priority": "high/medium/low",
      "assignee": "person or 'unspecified'"
    }
  ],
  "has_deadlines": true/false,
  "urgent_items": ["list of urgent tasks"]
}

JSON Response:`;

    try {
      const response = await this.hf.textGeneration({
        model: this.models.smart,
        inputs: prompt,
        parameters: {
          max_new_tokens: 400,
          temperature: 0.1,
          do_sample: true,
          return_full_text: false
        }
      });

      let data;
      try {
        const jsonMatch = response.generated_text.match(/\{[\s\S]*\}/);
        data = jsonMatch ? JSON.parse(jsonMatch[0]) : { action_items: [], has_deadlines: false, urgent_items: [] };
      } catch (parseError) {
        data = { action_items: [], has_deadlines: false, urgent_items: [] };
      }

      return {
        success: true,
        data: data,
        model_used: this.models.smart,
        provider: 'huggingface'
      };

    } catch (error) {
      console.error('Action Items Extraction Error:', error);
      return {
        success: false,
        error: error.message,
        fallback: {
          action_items: [],
          has_deadlines: false,
          urgent_items: []
        }
      };
    }
  }

  async summarizeEmailThread(emails) {
    if (!this.enabled) {
      throw new Error('Hugging Face AI service is disabled - missing HUGGINGFACE_API_TOKEN');
    }

    const emailsText = emails.map((email, index) => 
      `Email ${index + 1}:
From: ${email.from?.text || email.from}
Subject: ${email.subject}
Date: ${email.date}
Content: ${email.text || email.html}
---`
    ).join('\n\n');

    const prompt = `Summarize this email thread and provide key insights:

${emailsText}

Please provide:
1. Main discussion topics
2. Key decisions made
3. Outstanding action items
4. Next steps
5. Important deadlines

Summary:`;

    try {
      const response = await this.hf.textGeneration({
        model: this.models.smart,
        inputs: prompt,
        parameters: {
          max_new_tokens: 600,
          temperature: 0.2,
          do_sample: true,
          return_full_text: false
        }
      });

      return {
        success: true,
        summary: response.generated_text,
        model_used: this.models.smart,
        provider: 'huggingface',
        thread_length: emails.length
      };

    } catch (error) {
      console.error('Email Thread Summarization Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async detectLanguage(text) {
    if (!this.enabled) {
      throw new Error('Hugging Face AI service is disabled - missing HUGGINGFACE_API_TOKEN');
    }

    try {
      // Use a dedicated language detection model
      const response = await this.hf.request({
        model: 'facebook/fasttext-language-identification',
        inputs: text
      });

      return {
        success: true,
        language: response.label || 'unknown',
        confidence: response.score || 0,
        provider: 'huggingface'
      };

    } catch (error) {
      console.error('Language Detection Error:', error);
      return {
        success: false,
        error: error.message,
        fallback: { language: 'en', confidence: 0 }
      };
    }
  }

  async sentimentAnalysis(text) {
    if (!this.enabled) {
      throw new Error('Hugging Face AI service is disabled - missing HUGGINGFACE_API_TOKEN');
    }

    try {
      const response = await this.hf.textClassification({
        model: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
        inputs: text
      });

      const sentiment = response[0];
      return {
        success: true,
        sentiment: sentiment.label.toLowerCase(),
        confidence: sentiment.score,
        provider: 'huggingface'
      };

    } catch (error) {
      console.error('Sentiment Analysis Error:', error);
      return {
        success: false,
        error: error.message,
        fallback: { sentiment: 'neutral', confidence: 0 }
      };
    }
  }

  buildAnalysisPrompt(emailContent, analysisType) {
    const basePrompt = `Analyze this email and return the result as valid JSON format only:\n\nEmail Content:\n${emailContent}\n\n`;
    
    switch (analysisType) {
      case 'quick':
        return basePrompt + `Return only this JSON structure:
{
  "category": "support/sales/general/urgent",
  "priority": "high/medium/low", 
  "sentiment": "positive/neutral/negative",
  "summary": "brief summary in one sentence"
}`;
      
      case 'security':
        return basePrompt + `Analyze for security threats and return only this JSON:
{
  "is_safe": true/false,
  "threats": ["phishing", "spam", "malware"],
  "risk_level": "high/medium/low",
  "details": "brief explanation"
}`;
      
      default:
        return basePrompt + `Return only this JSON structure:
{
  "category": "support/sales/general/urgent",
  "priority": "high/medium/low",
  "sentiment": "positive/neutral/negative", 
  "key_topics": ["topic1", "topic2"],
  "action_items": ["action1", "action2"],
  "summary": "brief summary",
  "requires_human_review": true/false,
  "detected_language": "en",
  "urgency_score": 1-10
}`;
    }
  }

  extractAnalysisFromText(text) {
    // Fallback method to extract analysis when JSON parsing fails
    const analysis = {
      category: 'general',
      priority: 'medium',
      sentiment: 'neutral',
      summary: 'Analysis completed',
      raw_response: text
    };

    // Simple keyword detection for fallback
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('urgent') || lowerText.includes('asap') || lowerText.includes('immediate')) {
      analysis.priority = 'high';
      analysis.category = 'urgent';
    }
    
    if (lowerText.includes('positive') || lowerText.includes('good') || lowerText.includes('thank')) {
      analysis.sentiment = 'positive';
    } else if (lowerText.includes('negative') || lowerText.includes('bad') || lowerText.includes('complaint')) {
      analysis.sentiment = 'negative';
    }

    return analysis;
  }
}

module.exports = HuggingFaceAIService;