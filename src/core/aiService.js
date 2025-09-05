const Anthropic = require('@anthropic-ai/sdk');

class ClaudeAIService {
  constructor(apiKey) {
    if (!apiKey) {
      console.warn('⚠️ ANTHROPIC_API_KEY not provided - AI features will be disabled');
      console.warn('💡 Tip: Claude Pro (web) subscription is different from Anthropic API');
      console.warn('💡 Get API access at: https://console.anthropic.com/');
      console.warn('💡 Alternative: Use free AI providers like Groq, Hugging Face, or OpenAI free tier');
      this.enabled = false;
      return;
    }
    
    this.anthropic = new Anthropic({
      apiKey: apiKey,
    });
    this.enabled = true;
    
    // Model configurations
    this.models = {
      fast: 'claude-3-5-haiku-20241022', // Fast for simple categorization
      smart: 'claude-3-5-sonnet-20241022', // Best performance for complex analysis
      powerful: 'claude-3-opus-20240229' // Most powerful for complex tasks
    };
  }

  isEnabled() {
    return this.enabled;
  }

  async analyzeEmail(emailContent, options = {}) {
    if (!this.enabled) {
      throw new Error('AI service is disabled - missing ANTHROPIC_API_KEY');
    }

    const {
      model = this.models.smart,
      includeResponse = false,
      analysisType = 'comprehensive'
    } = options;

    let prompt = '';
    
    switch (analysisType) {
      case 'quick':
        prompt = `Quickly analyze this email and provide:
- Category (support/sales/general/urgent)
- Priority level (high/medium/low)
- Sentiment (positive/neutral/negative)
- One sentence summary

Email:
${emailContent}

Respond in JSON format.`;
        break;
        
      case 'comprehensive':
        prompt = `Perform comprehensive email analysis:

Email Content:
${emailContent}

Please analyze and return JSON with:
{
  "category": "support/sales/general/urgent/spam",
  "priority": "high/medium/low",
  "sentiment": "positive/neutral/negative", 
  "urgency_score": 1-10,
  "key_topics": ["topic1", "topic2"],
  "action_items": ["action1", "action2"],
  "sender_intent": "brief description",
  "requires_human_review": true/false,
  "summary": "brief summary",
  "detected_language": "en/es/fr/etc",
  "contains_sensitive_info": true/false
}`;
        break;
        
      case 'security':
        prompt = `Analyze this email for security concerns:

Email:
${emailContent}

Check for:
- Phishing attempts
- Suspicious links
- Malware indicators  
- Social engineering
- Spam characteristics
- Impersonation attempts

Return JSON with security assessment.`;
        break;
    }

    try {
      const response = await this.anthropic.messages.create({
        model: model,
        max_tokens: analysisType === 'quick' ? 500 : 1500,
        temperature: 0.1,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      let analysis;
      try {
        analysis = JSON.parse(response.content[0].text);
      } catch (parseError) {
        // Fallback if JSON parsing fails
        analysis = {
          raw_analysis: response.content[0].text,
          category: 'general',
          priority: 'medium',
          sentiment: 'neutral'
        };
      }

      return {
        success: true,
        analysis: analysis,
        model_used: response.model,
        usage: response.usage,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Claude AI Analysis Error:', error);
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
      throw new Error('AI service is disabled - missing ANTHROPIC_API_KEY');
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
- Don't make promises you can't keep

Generate only the email response content:`;

    try {
      const response = await this.anthropic.messages.create({
        model: this.models.smart,
        max_tokens: 1000,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      return {
        success: true,
        response: response.content[0].text.trim(),
        model_used: response.model,
        usage: response.usage
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
      throw new Error('AI service is disabled - missing ANTHROPIC_API_KEY');
    }

    // Process in batches to avoid rate limits
    const batchSize = 10;
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
        }))
      );

      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Rate limiting delay between batches
        if (i + batchSize < emails.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Batch categorization error for batch starting at ${i}:`, error);
        // Add fallback results for failed batch
        batch.forEach((email, index) => {
          results.push({
            success: false,
            emailIndex: i + index,
            email: email,
            fallback_analysis: {
              category: 'general',
              priority: 'medium',
              summary: 'AI categorization failed'
            }
          });
        });
      }
    }

    return results;
  }

  async extractActionItems(emailContent) {
    if (!this.enabled) {
      throw new Error('AI service is disabled - missing ANTHROPIC_API_KEY');
    }

    const prompt = `Extract action items, deadlines, and tasks from this email:

${emailContent}

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
}`;

    try {
      const response = await this.anthropic.messages.create({
        model: this.models.smart,
        max_tokens: 800,
        temperature: 0.1,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      return {
        success: true,
        data: JSON.parse(response.content[0].text),
        model_used: response.model
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
      throw new Error('AI service is disabled - missing ANTHROPIC_API_KEY');
    }

    const emailsText = emails.map((email, index) => 
      `Email ${index + 1}:
From: ${email.from?.text || email.from}
Subject: ${email.subject}
Date: ${email.date}
Content: ${email.text || email.html}
---`
    ).join('\n\n');

    const prompt = `Summarize this email thread:

${emailsText}

Provide:
1. Main discussion topics
2. Key decisions made
3. Outstanding action items
4. Next steps
5. Important deadlines

Keep summary concise but comprehensive.`;

    try {
      const response = await this.anthropic.messages.create({
        model: this.models.smart,
        max_tokens: 1200,
        temperature: 0.2,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      return {
        success: true,
        summary: response.content[0].text,
        model_used: response.model,
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
}

module.exports = ClaudeAIService;