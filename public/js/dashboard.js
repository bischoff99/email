// Email Integration Server - Dashboard JavaScript

class EmailDashboard {
    constructor() {
        this.baseURL = window.location.origin;
        this.init();
    }

    init() {
        this.setupTabs();
        this.setupForms();
        this.loadSystemStatus();
        this.setupPeriodicUpdates();
    }

    // Tab Management
    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                
                // Remove active class from all tabs and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                button.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
            });
        });
    }

    // Form Setup
    setupForms() {
        // AI Features Forms
        this.setupForm('analyze-form', '/api/ai/analyze-email', 'analysis-result');
        this.setupForm('response-form', '/api/ai/generate-response', 'response-result');
        this.setupForm('actions-form', '/api/ai/extract-actions', 'actions-result');
        this.setupForm('smart-form', '/api/ai/smart-process', 'smart-result');
        
        // Email Management Forms
        this.setupForm('search-form', '/api/emails/search', 'search-result', 'POST');
        this.setupLatestForm();
        this.setupForm('categorize-form', '/api/ai/categorize-emails', 'categorize-result');
        this.setupForm('summarize-form', '/api/ai/summarize-thread', 'summarize-result');
        
        // Automation Forms
        this.setupForm('verify-form', '/api/automation/verify-email', 'verify-result');
        this.setupForm('extract-form', '/api/emails/extract-links', 'extract-result');
    }

    setupForm(formId, endpoint, resultId, method = 'POST') {
        const form = document.getElementById(formId);
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleFormSubmit(form, endpoint, resultId, method);
        });
    }

    setupLatestForm() {
        const form = document.getElementById('latest-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const sender = formData.get('sender');
            const count = formData.get('count') || 5;
            
            const endpoint = `/api/emails/latest/${encodeURIComponent(sender)}?count=${count}`;
            await this.handleApiCall('GET', endpoint, null, 'latest-result');
        });
    }

    async handleFormSubmit(form, endpoint, resultId, method) {
        const formData = new FormData(form);
        const data = {};
        
        // Convert FormData to object
        for (let [key, value] of formData.entries()) {
            if (key === 'emails' && value.trim()) {
                try {
                    data[key] = JSON.parse(value);
                } catch (e) {
                    this.showError(resultId, 'Invalid JSON format in emails field');
                    return;
                }
            } else if (key === 'generateResponse') {
                data[key] = form.querySelector(`[name="${key}"]`).checked;
            } else if (value.trim()) {
                data[key] = value;
            }
        }

        await this.handleApiCall(method, endpoint, data, resultId);
    }

    async handleApiCall(method, endpoint, data, resultId) {
        const resultArea = document.getElementById(resultId);
        if (!resultArea) return;

        this.showLoading();
        
        try {
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            if (data && method !== 'GET') {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(this.baseURL + endpoint, options);
            const result = await response.json();

            this.hideLoading();

            if (response.ok) {
                this.showResult(resultArea, result, 'success');
            } else {
                this.showResult(resultArea, result, 'error');
            }
        } catch (error) {
            this.hideLoading();
            this.showError(resultId, `Network error: ${error.message}`);
        }
    }

    showResult(resultArea, data, type) {
        resultArea.innerHTML = '';
        
        const resultDiv = document.createElement('div');
        resultDiv.className = `result-content result-${type}`;
        
        const pre = document.createElement('pre');
        pre.textContent = JSON.stringify(data, null, 2);
        
        resultDiv.appendChild(pre);
        resultArea.appendChild(resultDiv);
        
        // Add syntax highlighting
        this.highlightJSON(pre);
    }

    showError(resultId, message) {
        const resultArea = document.getElementById(resultId);
        if (!resultArea) return;

        resultArea.innerHTML = '';
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message message-error';
        errorDiv.textContent = message;
        
        resultArea.appendChild(errorDiv);
    }

    highlightJSON(element) {
        const jsonString = element.textContent;
        const highlighted = jsonString
            .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
            .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
            .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
            .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
            .replace(/: (null)/g, ': <span class="json-null">$1</span>');
        
        element.innerHTML = highlighted;
    }

    showLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.add('show');
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
    }

    // System Status
    async loadSystemStatus() {
        try {
            // Load health status
            const healthResponse = await fetch(`${this.baseURL}/health`);
            const healthData = await healthResponse.json();
            this.updateHealthStatus(healthData);

            // Load AI status
            const aiResponse = await fetch(`${this.baseURL}/api/ai/status`);
            const aiData = await aiResponse.json();
            this.updateAIStatus(aiData);

            // Update server info
            this.updateServerInfo(healthData);

        } catch (error) {
            console.error('Failed to load system status:', error);
            this.updateStatusIndicators('error');
        }
    }

    updateHealthStatus(data) {
        const healthStatus = document.getElementById('health-status');
        if (!healthStatus) return;

        const checks = data.checks || {};
        let html = '';

        Object.entries(checks).forEach(([service, check]) => {
            const statusClass = check.status === 'healthy' ? 'success' : 
                               check.status === 'degraded' ? 'warning' : 'error';
            
            html += `
                <div class="info-item">
                    <span class="label">${service.charAt(0).toUpperCase() + service.slice(1)}</span>
                    <span class="value ${statusClass}">${check.status}</span>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 10px;">
                    ${check.message}
                </div>
            `;
        });

        healthStatus.innerHTML = html;
        
        // Update status indicators
        this.updateStatusIndicators(data.status);
    }

    updateAIStatus(data) {
        const aiStatus = document.getElementById('ai-service-status');
        if (!aiStatus) return;

        const providers = data.availableProviders || {};
        let html = `
            <div class="info-item">
                <span class="label">Primary Provider</span>
                <span class="value">${data.primaryProvider || 'None'}</span>
            </div>
            <div class="info-item">
                <span class="label">AI Enabled</span>
                <span class="value ${data.aiEnabled ? 'success' : 'error'}">${data.aiEnabled ? 'Yes' : 'No'}</span>
            </div>
        `;

        if (data.availableModels) {
            html += `
                <div class="info-item">
                    <span class="label">Available Models</span>
                    <span class="value">${Object.keys(data.availableModels).length}</span>
                </div>
            `;
        }

        html += '<div style="margin-top: 15px; font-size: 0.9rem; color: var(--text-secondary);">Providers:</div>';
        
        Object.entries(providers).forEach(([provider, available]) => {
            const status = available ? 'Available' : 'Not Configured';
            const statusClass = available ? 'success' : 'secondary';
            html += `
                <div class="info-item">
                    <span class="label">${provider.charAt(0).toUpperCase() + provider.slice(1)}</span>
                    <span class="value ${statusClass}">${status}</span>
                </div>
            `;
        });

        aiStatus.innerHTML = html;
    }

    updateServerInfo(data) {
        const envValue = document.getElementById('env-value');
        const versionValue = document.getElementById('version-value');
        const uptimeValue = document.getElementById('uptime-value');

        if (envValue) envValue.textContent = data.environment || 'Unknown';
        if (versionValue) versionValue.textContent = data.version || '1.0.0';
        if (uptimeValue && data.uptime) {
            const hours = Math.floor(data.uptime / 3600);
            const minutes = Math.floor((data.uptime % 3600) / 60);
            uptimeValue.textContent = `${hours}h ${minutes}m`;
        }
    }

    updateStatusIndicators(status) {
        const serverStatus = document.getElementById('server-status');
        const aiStatusElement = document.getElementById('ai-status');
        const emailStatus = document.getElementById('email-status');

        if (serverStatus) {
            const indicator = serverStatus.querySelector('.indicator');
            indicator.className = 'indicator ' + (status === 'healthy' ? 'healthy' : 
                                                 status === 'degraded' ? 'warning' : 'error');
        }

        // AI and email status will be updated based on the health check data
        if (aiStatusElement) {
            const indicator = aiStatusElement.querySelector('.indicator');
            indicator.className = 'indicator healthy'; // AI is always available with local intelligence
        }
    }

    setupPeriodicUpdates() {
        // Update status every 30 seconds
        setInterval(() => {
            this.loadSystemStatus();
        }, 30000);
    }
}

// Utility Functions
function formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleString();
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        console.log('Copied to clipboard');
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EmailDashboard();
});

// Add some helpful console messages
console.log('🚀 Email Integration Server Dashboard Loaded');
console.log('💡 Use the tabs above to access different features');
console.log('📊 System status updates every 30 seconds');
console.log('🤖 AI features powered by OpenAI GPT-4 with intelligent fallbacks');