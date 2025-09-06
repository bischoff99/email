const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.enabled = !!process.env.OPENAI_API_KEY;
    
    if (this.enabled) {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      
      this.models = {
        fast: 'gpt-3.5-turbo',
        smart: 'gpt-4o-mini',
        premium: 'gpt-4o'
      };
      
      console.log('✅ OpenAI service initialized with GPT-4 models');
    } else {
      console.log('⚠️  OpenAI service disabled - missing OPENAI_API_KEY');
    }
  }

  isEnabled() {
    return this.enabled;
  }

  async analyzeEmail(emailContent) {
    if (!this.enabled) {
      throw new Error('OpenAI service is disabled - missing OPENAI_API_KEY');
    }

    const prompt = `Analyze this email and return a JSON response with the following structure:
{
  "category": "urgent|support|sales|meeting|report|complaint|general",
  "priority": "low|medium|high",
  "sentiment": "positive|negative|neutral",
  "key_topics": ["array", "of", "key", "topics"],
  "action_items": ["array", "of", "action", "items"],
  "summary": "brief summary of email content",
  "requires_human_review": true/false,
  "detected_language": "en|es|fr|de|etc",
  "urgency_score": 1-10,
  "confidence": 0.0-1.0
}

Email content: ${emailContent}

Return only valid JSON, no additional text.`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.models.smart,
        messages: [
          {
            role: 'system',
            content: 'You are an expert email analysis assistant. Analyze emails and return structured JSON responses with high accuracy.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const analysis = JSON.parse(response.choices[0].message.content.trim());
      
      return {
        success: true,
        analysis: analysis,
        model_used: this.models.smart,
        provider: 'openai',
        timestamp: new Date().toISOString(),
        note: 'Analysis performed using OpenAI GPT-4 models'
      };

    } catch (error) {
      console.error('OpenAI Email Analysis Error:', error);
      throw error;
    }
  }

  async generateEmailResponse(originalEmail, context = '', tone = 'professional') {
    if (!this.enabled) {
      throw new Error('OpenAI service is disabled - missing OPENAI_API_KEY');
    }

    const toneInstructions = {
      professional: 'professional and courteous',
      friendly: 'warm and friendly',
      formal: 'formal and business-like',
      casual: 'casual and relaxed'
    };

    const prompt = `Generate a ${toneInstructions[tone] || 'professional'} email response to the following email.

Original email: ${originalEmail}

${context ? `Additional context: ${context}` : ''}

Requirements:
- Use a ${tone} tone
- Be helpful and appropriate
- Include proper greetings and closings
- Keep response concise but complete
- Address the main points from the original email

Return only the email response content, no additional formatting or explanations.`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.models.smart,
        messages: [
          {
            role: 'system',
            content: 'You are a professional email assistant. Generate appropriate email responses based on the original email content and specified tone.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 800
      });

      return {
        success: true,
        response: response.choices[0].message.content.trim(),
        model_used: this.models.smart,
        provider: 'openai',
        note: 'Response generated using OpenAI GPT-4 models'
      };

    } catch (error) {
      console.error('OpenAI Response Generation Error:', error);
      throw error;
    }
  }

  async extractActionItems(emailContent) {
    if (!this.enabled) {
      throw new Error('OpenAI service is disabled - missing OPENAI_API_KEY');
    }

    const prompt = `Extract action items from this email and return a JSON response:
{
  "action_items": [
    {
      "task": "description of task",
      "deadline": "deadline if mentioned or 'none'",
      "priority": "high|medium|low",
      "assignee": "person assigned or 'unspecified'"
    }
  ],
  "has_deadlines": true/false,
  "urgent_items": ["array", "of", "urgent", "items"]
}

Email: ${emailContent}

Return only valid JSON, no additional text.`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.models.smart,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at extracting actionable tasks from emails. Return structured JSON with all action items found.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 800
      });

      const data = JSON.parse(response.choices[0].message.content.trim());
      
      return {
        success: true,
        data: data,
        model_used: this.models.smart,
        provider: 'openai',
        note: 'Action items extracted using OpenAI GPT-4 models'
      };

    } catch (error) {
      console.error('OpenAI Action Items Extraction Error:', error);
      throw error;
    }
  }

  async categorizeEmails(emails) {
    if (!this.enabled) {
      throw new Error('OpenAI service is disabled - missing OPENAI_API_KEY');
    }

    const results = [];
    
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      
      try {
        const analysis = await this.analyzeEmail(email.text || email.content || JSON.stringify(email));
        
        results.push({
          ...analysis,
          emailIndex: i,
          email: email
        });
        
        // Small delay to respect rate limits
        if (i < emails.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        console.error(`Error analyzing email ${i}:`, error);
        results.push({
          success: false,
          error: error.message,
          emailIndex: i,
          email: email
        });
      }
    }

    return {
      success: true,
      results: results,
      summary: {
        total: emails.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    };
  }

  async summarizeEmailThread(emails) {
    if (!this.enabled) {
      throw new Error('OpenAI service is disabled - missing OPENAI_API_KEY');
    }

    const emailTexts = emails.map((email, index) => 
      `Email ${index + 1}: ${email.text || email.content || JSON.stringify(email)}`
    ).join('\n\n');

    const prompt = `Summarize this email thread and return a JSON response:
{
  "summary": "overall summary of the email thread",
  "key_points": ["array", "of", "key", "points"],
  "participants": ["list", "of", "participants"],
  "next_actions": ["suggested", "next", "actions"],
  "sentiment_progression": "how sentiment changed throughout thread",
  "thread_length": number_of_emails
}

Email thread:
${emailTexts}

Return only valid JSON, no additional text.`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.models.smart,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at summarizing email conversations and identifying key themes and action items.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const summary = JSON.parse(response.choices[0].message.content.trim());
      
      return {
        success: true,
        summary: summary,
        model_used: this.models.smart,
        provider: 'openai',
        note: 'Thread summary generated using OpenAI GPT-4 models'
      };

    } catch (error) {
      console.error('OpenAI Thread Summarization Error:', error);
      throw error;
    }
  }

  async detectLanguage(text) {
    if (!this.enabled) {
      throw new Error('OpenAI service is disabled - missing OPENAI_API_KEY');
    }

    try {
      const response = await this.client.chat.completions.create({
        model: this.models.fast,
        messages: [
          {
            role: 'system',
            content: 'Detect the language of the given text. Respond with only the ISO 639-1 language code (e.g., "en", "es", "fr", "de").'
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.1,
        max_tokens: 10
      });

      return {
        success: true,
        language: response.choices[0].message.content.trim().toLowerCase(),
        model_used: this.models.fast,
        provider: 'openai'
      };

    } catch (error) {
      console.error('OpenAI Language Detection Error:', error);
      throw error;
    }
  }

  async sentimentAnalysis(text) {
    if (!this.enabled) {
      throw new Error('OpenAI service is disabled - missing OPENAI_API_KEY');
    }

    const prompt = `Analyze the sentiment of this text and return a JSON response:
{
  "sentiment": "positive|negative|neutral",
  "confidence": 0.0-1.0,
  "emotions": ["array", "of", "detected", "emotions"],
  "intensity": "low|medium|high"
}

Text: ${text}

Return only valid JSON, no additional text.`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.models.fast,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at sentiment analysis. Analyze text and return accurate sentiment classifications.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 300
      });

      const analysis = JSON.parse(response.choices[0].message.content.trim());
      
      return {
        success: true,
        analysis: analysis,
        model_used: this.models.fast,
        provider: 'openai'
      };

    } catch (error) {
      console.error('OpenAI Sentiment Analysis Error:', error);
      throw error;
    }
  }
}

module.exports = OpenAIService;