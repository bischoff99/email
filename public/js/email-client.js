// AI-Powered Email Client JavaScript

class EmailClient {
    constructor() {
        this.currentEmails = [];
        this.selectedEmail = null;
        this.currentPage = 0;
        this.emailsPerPage = 20;
        this.totalEmails = 0;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadEmails();
        this.checkAIStatus();
    }

    bindEvents() {
        // Header events
        document.getElementById('compose-btn').addEventListener('click', () => this.openCompose());
        document.getElementById('email-search').addEventListener('input', (e) => this.searchEmails(e.target.value));
        document.getElementById('refresh-btn').addEventListener('click', () => this.loadEmails());
        
        // Pagination
        document.getElementById('prev-btn').addEventListener('click', () => this.prevPage());
        document.getElementById('next-btn').addEventListener('click', () => this.nextPage());
        
        // Email actions
        document.getElementById('analyze-btn').addEventListener('click', () => this.analyzeEmail());
        document.getElementById('generate-response-btn').addEventListener('click', () => this.generateResponse());
        document.getElementById('reply-btn').addEventListener('click', () => this.replyToEmail());
        document.getElementById('forward-btn').addEventListener('click', () => this.forwardEmail());
        
        // AI shortcuts
        document.querySelectorAll('.ai-shortcut').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleAIShortcut(e.target.dataset.action));
        });
        
        // Compose modal
        document.getElementById('close-compose-btn').addEventListener('click', () => this.closeCompose());
        document.getElementById('compose-form').addEventListener('submit', (e) => this.sendEmail(e));
        document.getElementById('ai-improve-btn').addEventListener('click', () => this.improveEmailWithAI());
        document.getElementById('ai-tone-btn').addEventListener('click', () => this.adjustTone());
        
        // AI results
        document.getElementById('close-ai-btn').addEventListener('click', () => this.closeAIResults());
        
        // Folder navigation
        document.querySelectorAll('.folder-item').forEach(folder => {
            folder.addEventListener('click', (e) => this.switchFolder(e.currentTarget.dataset.folder));
        });
    }

    async loadEmails() {
        this.showLoadingState();
        
        try {
            const offset = this.currentPage * this.emailsPerPage;
            const response = await fetch(`/api/emails/inbox?limit=${this.emailsPerPage}&offset=${offset}`);
            const data = await response.json();
            
            if (data.success) {
                this.currentEmails = data.emails;
                this.totalEmails = data.total;
                this.renderEmailList();
                this.updatePagination();
                this.updateInboxCount(data.total);
            } else {
                this.showError('Failed to load emails: ' + data.error);
            }
        } catch (error) {
            console.error('Error loading emails:', error);
            this.showError('Failed to connect to email server');
        }
    }

    showLoadingState() {
        const emailList = document.getElementById('email-list');
        emailList.innerHTML = `
            <div class="loading-emails">
                <div class="loading-spinner"></div>
                <p>Loading emails...</p>
            </div>
        `;
    }

    renderEmailList() {
        const emailList = document.getElementById('email-list');
        
        if (this.currentEmails.length === 0) {
            emailList.innerHTML = `
                <div class="no-emails">
                    <div class="no-email-icon">📭</div>
                    <h3>No emails found</h3>
                    <p>Your inbox is empty or all emails have been loaded.</p>
                </div>
            `;
            return;
        }

        emailList.innerHTML = this.currentEmails.map((email, index) => `
            <div class="email-item ${email.isRead ? '' : 'unread'}" 
                 data-email-id="${email.messageId}" 
                 onclick="emailClient.selectEmail('${email.messageId}', ${index})">
                <div class="email-item-header">
                    <span class="email-sender">${this.extractEmailAddress(email.from)}</span>
                    <span class="email-time">${this.formatDate(email.date)}</span>
                </div>
                <div class="email-subject-line">${email.subject || '(No Subject)'}</div>
                <div class="email-preview">${email.preview || 'No preview available'}</div>
                ${email.hasAttachments ? '<div class="attachment-indicator">📎</div>' : ''}
            </div>
        `).join('');
    }

    async selectEmail(messageId, index) {
        // Update visual selection
        document.querySelectorAll('.email-item').forEach(item => item.classList.remove('selected'));
        document.querySelector(`[data-email-id="${messageId}"]`).classList.add('selected');
        
        // Load full email content
        try {
            const response = await fetch(`/api/emails/email/${encodeURIComponent(messageId)}`);
            const data = await response.json();
            
            if (data.success) {
                this.selectedEmail = data.email;
                this.renderEmailView();
            } else {
                this.showError('Failed to load email: ' + data.error);
            }
        } catch (error) {
            console.error('Error loading email:', error);
            this.showError('Failed to load email content');
        }
    }

    renderEmailView() {
        const emailView = document.getElementById('email-view');
        const noEmailSelected = document.querySelector('.no-email-selected');
        
        if (!this.selectedEmail) {
            emailView.style.display = 'none';
            noEmailSelected.style.display = 'flex';
            return;
        }

        noEmailSelected.style.display = 'none';
        emailView.style.display = 'flex';
        
        // Update email metadata
        document.getElementById('email-subject').textContent = this.selectedEmail.subject || '(No Subject)';
        document.getElementById('email-from').textContent = `From: ${this.extractEmailAddress(this.selectedEmail.from)}`;
        document.getElementById('email-date').textContent = `Date: ${this.formatFullDate(this.selectedEmail.date)}`;
        
        // Update email content
        const emailContent = document.getElementById('email-content');
        if (this.selectedEmail.html) {
            emailContent.innerHTML = this.sanitizeHTML(this.selectedEmail.html);
        } else {
            emailContent.innerHTML = `<pre>${this.escapeHTML(this.selectedEmail.text || 'No content available')}</pre>`;
        }
    }

    async analyzeEmail() {
        if (!this.selectedEmail) return;
        
        this.showAIResults('Analyzing email...');
        
        try {
            const response = await fetch('/api/ai/analyze-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: this.selectedEmail.subject,
                    body: this.selectedEmail.text || this.selectedEmail.html,
                    sender: this.extractEmailAddress(this.selectedEmail.from)
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.displayAIAnalysis(data.analysis);
            } else {
                this.showAIResults(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error('Error analyzing email:', error);
            this.showAIResults('Failed to analyze email');
        }
    }

    async generateResponse() {
        if (!this.selectedEmail) return;
        
        this.showAIResults('Generating response...');
        
        try {
            const response = await fetch('/api/ai/generate-response', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    originalSubject: this.selectedEmail.subject,
                    originalBody: this.selectedEmail.text || this.selectedEmail.html,
                    sender: this.extractEmailAddress(this.selectedEmail.from),
                    tone: 'professional'
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.displayGeneratedResponse(data.response);
            } else {
                this.showAIResults(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error('Error generating response:', error);
            this.showAIResults('Failed to generate response');
        }
    }

    displayAIAnalysis(analysis) {
        const content = `
            <div class="ai-analysis">
                <h4>📊 Email Analysis</h4>
                <div class="analysis-section">
                    <strong>📈 Sentiment:</strong> ${analysis.sentiment || 'Neutral'}
                </div>
                <div class="analysis-section">
                    <strong>🎯 Intent:</strong> ${analysis.intent || 'Information'}
                </div>
                <div class="analysis-section">
                    <strong>⚡ Urgency:</strong> ${analysis.urgency || 'Normal'}
                </div>
                <div class="analysis-section">
                    <strong>🏷️ Category:</strong> ${analysis.category || 'General'}
                </div>
                ${analysis.keyPoints ? `
                    <div class="analysis-section">
                        <strong>🔑 Key Points:</strong>
                        <ul>
                            ${analysis.keyPoints.map(point => `<li>${point}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                ${analysis.actionItems ? `
                    <div class="analysis-section">
                        <strong>📋 Action Items:</strong>
                        <ul>
                            ${analysis.actionItems.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
        this.showAIResults(content);
    }

    displayGeneratedResponse(response) {
        const content = `
            <div class="ai-response">
                <h4>✍️ Generated Response</h4>
                <div class="response-preview">
                    <div class="response-subject">
                        <strong>Subject:</strong> ${response.subject}
                    </div>
                    <div class="response-body">
                        <strong>Body:</strong>
                        <div class="response-content">${response.body.replace(/\n/g, '<br>')}</div>
                    </div>
                </div>
                <div class="response-actions">
                    <button class="action-btn" onclick="emailClient.useGeneratedResponse('${this.escapeQuotes(response.subject)}', '${this.escapeQuotes(response.body)}')">
                        📝 Use This Response
                    </button>
                    <button class="action-btn" onclick="emailClient.regenerateResponse()">
                        🔄 Regenerate
                    </button>
                </div>
            </div>
        `;
        this.showAIResults(content);
    }

    useGeneratedResponse(subject, body) {
        this.openCompose();
        document.getElementById('compose-to').value = this.extractEmailAddress(this.selectedEmail.from);
        document.getElementById('compose-subject').value = subject;
        document.getElementById('compose-message').value = body;
        this.closeAIResults();
    }

    showAIResults(content) {
        const aiResults = document.getElementById('ai-results');
        const aiResultsContent = document.getElementById('ai-results-content');
        
        aiResultsContent.innerHTML = typeof content === 'string' ? content : content.outerHTML;
        aiResults.style.display = 'block';
    }

    closeAIResults() {
        document.getElementById('ai-results').style.display = 'none';
    }

    openCompose() {
        document.getElementById('compose-modal').style.display = 'flex';
    }

    closeCompose() {
        document.getElementById('compose-modal').style.display = 'none';
        document.getElementById('compose-form').reset();
    }

    replyToEmail() {
        if (!this.selectedEmail) return;
        
        this.openCompose();
        document.getElementById('compose-to').value = this.extractEmailAddress(this.selectedEmail.from);
        document.getElementById('compose-subject').value = `Re: ${this.selectedEmail.subject}`;
    }

    forwardEmail() {
        if (!this.selectedEmail) return;
        
        this.openCompose();
        document.getElementById('compose-subject').value = `Fwd: ${this.selectedEmail.subject}`;
        document.getElementById('compose-message').value = `\n\n--- Forwarded Message ---\n${this.selectedEmail.text || 'Original message content'}`;
    }

    async sendEmail(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const emailData = {
            to: formData.get('to'),
            subject: formData.get('subject'),
            body: formData.get('message')
        };

        // Note: This would require implementing SMTP sending functionality
        alert('Email sending functionality would be implemented with SMTP configuration');
        this.closeCompose();
    }

    async handleAIShortcut(action) {
        switch (action) {
            case 'analyze-batch':
                await this.analyzeBatchEmails();
                break;
            case 'categorize-batch':
                await this.categorizeBatchEmails();
                break;
            case 'extract-actions':
                await this.extractActionsFromEmails();
                break;
        }
    }

    async analyzeBatchEmails() {
        this.showLoadingDialog('Analyzing all emails...');
        
        try {
            const emailTexts = this.currentEmails.map(email => ({
                subject: email.subject,
                body: email.text || email.preview,
                sender: this.extractEmailAddress(email.from)
            }));

            const response = await fetch('/api/ai/categorize-emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emails: emailTexts })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.displayBatchResults('Batch Analysis Complete', data.categories);
            }
        } catch (error) {
            console.error('Error in batch analysis:', error);
        }
        
        this.hideLoadingDialog();
    }

    updatePagination() {
        const totalPages = Math.ceil(this.totalEmails / this.emailsPerPage);
        const currentPageNum = this.currentPage + 1;
        
        document.getElementById('page-info').textContent = `${currentPageNum} of ${totalPages}`;
        document.getElementById('prev-btn').disabled = this.currentPage === 0;
        document.getElementById('next-btn').disabled = this.currentPage >= totalPages - 1;
    }

    prevPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.loadEmails();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.totalEmails / this.emailsPerPage);
        if (this.currentPage < totalPages - 1) {
            this.currentPage++;
            this.loadEmails();
        }
    }

    updateInboxCount(count) {
        document.getElementById('inbox-count').textContent = count;
    }

    async checkAIStatus() {
        try {
            const response = await fetch('/api/ai/status');
            const data = await response.json();
            
            const indicator = document.getElementById('ai-indicator');
            const label = document.querySelector('.ai-label');
            
            if (data.success && data.status.available) {
                indicator.textContent = '🤖';
                label.textContent = 'AI Ready';
            } else {
                indicator.textContent = '⚠️';
                label.textContent = 'AI Unavailable';
            }
        } catch (error) {
            console.error('Error checking AI status:', error);
        }
    }

    // Utility functions
    extractEmailAddress(emailObj) {
        if (typeof emailObj === 'string') return emailObj;
        if (emailObj && emailObj.text) return emailObj.text;
        if (emailObj && emailObj.address) return emailObj.address;
        if (Array.isArray(emailObj) && emailObj.length > 0) {
            return this.extractEmailAddress(emailObj[0]);
        }
        return 'Unknown';
    }

    formatDate(date) {
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        
        if (diff < 24 * 60 * 60 * 1000) { // Less than 24 hours
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diff < 7 * 24 * 60 * 60 * 1000) { // Less than a week
            return d.toLocaleDateString([], { weekday: 'short' });
        } else {
            return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    }

    formatFullDate(date) {
        return new Date(date).toLocaleString();
    }

    sanitizeHTML(html) {
        // Basic HTML sanitization - in production, use a proper library like DOMPurify
        return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }

    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeQuotes(text) {
        return text.replace(/'/g, "\\'").replace(/"/g, '\\"');
    }

    showError(message) {
        const emailList = document.getElementById('email-list');
        emailList.innerHTML = `
            <div class="error-message">
                <div class="error-icon">❌</div>
                <h3>Error</h3>
                <p>${message}</p>
                <button onclick="emailClient.loadEmails()" class="retry-btn">Retry</button>
            </div>
        `;
    }

    showLoadingDialog(message) {
        // Simple loading implementation - could be enhanced with a proper modal
        console.log('Loading:', message);
    }

    hideLoadingDialog() {
        console.log('Loading complete');
    }

    displayBatchResults(title, results) {
        alert(`${title}\n\nResults:\n${JSON.stringify(results, null, 2)}`);
    }
}

// Initialize the email client when the page loads
let emailClient;
document.addEventListener('DOMContentLoaded', () => {
    emailClient = new EmailClient();
});

// Global functions for event handlers
window.emailClient = emailClient;