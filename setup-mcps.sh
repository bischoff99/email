#!/bin/bash

# MCP Setup Script for Email Integration Project
# This script installs and configures MCP servers for your email automation project

set -e

echo "🚀 Setting up MCPs for Email Integration Project..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js and npm are installed
check_dependencies() {
    print_status "Checking dependencies..."

    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi

    print_success "Node.js $(node --version) and npm $(npm --version) are installed"
}

# Install MCP servers
install_mcps() {
    print_status "Installing MCP servers..."

    # Core MCPs
    print_status "Installing core MCPs..."
    npm install -g @upstash/context7-mcp
    npm install -g @modelcontextprotocol/server-sequential-thinking
    npm install -g @modelcontextprotocol/server-filesystem
    npm install -g @agent-infra/mcp-server-browser

    # Email MCPs
    print_status "Installing email MCPs..."
    npm install -g mcp-server-email || print_warning "mcp-server-email not found, skipping..."
    npm install -g mcp-server-imap || print_warning "mcp-server-imap not found, skipping..."
    npm install -g mcp-server-smtp || print_warning "mcp-server-smtp not found, skipping..."

    # Automation MCPs
    print_status "Installing automation MCPs..."
    npm install -g mcp-server-puppeteer || print_warning "mcp-server-puppeteer not found, skipping..."
    npm install -g mcp-server-testing || print_warning "mcp-server-testing not found, skipping..."

    # Database MCPs
    print_status "Installing database MCPs..."
    npm install -g @supabase/mcp-server-supabase
    npm install -g mcp-server-postgres || print_warning "mcp-server-postgres not found, skipping..."
    npm install -g mcp-server-redis || print_warning "mcp-server-redis not found, skipping..."

    # API MCPs
    print_status "Installing API MCPs..."
    npm install -g mcp-server-http || print_warning "mcp-server-http not found, skipping..."
    npm install -g mcp-server-webhook || print_warning "mcp-server-webhook not found, skipping..."
    npm install -g mcp-server-cron || print_warning "mcp-server-cron not found, skipping..."

    # Monitoring MCPs
    print_status "Installing monitoring MCPs..."
    npm install -g @sentry/mcp-server
    npm install -g mcp-server-logging || print_warning "mcp-server-logging not found, skipping..."
    npm install -g mcp-server-metrics || print_warning "mcp-server-metrics not found, skipping..."

    # Deployment MCPs
    print_status "Installing deployment MCPs..."
    npm install -g @heroku/mcp-server
    npm install -g mcp-server-docker || print_warning "mcp-server-docker not found, skipping..."
    npm install -g mcp-server-kubernetes || print_warning "mcp-server-kubernetes not found, skipping..."
    npm install -g mcp-server-aws || print_warning "mcp-server-aws not found, skipping..."

    print_success "MCP servers installation completed"
}

# Create MCP configuration directory
setup_config() {
    print_status "Setting up MCP configuration..."

    # Create MCP config directory if it doesn't exist
    MCP_CONFIG_DIR="$HOME/.cursor/mcp"
    if [ ! -d "$MCP_CONFIG_DIR" ]; then
        mkdir -p "$MCP_CONFIG_DIR"
        print_success "Created MCP config directory: $MCP_CONFIG_DIR"
    fi

    # Copy configuration file
    if [ -f "mcp-config.json" ]; then
        cp mcp-config.json "$MCP_CONFIG_DIR/config.json"
        print_success "MCP configuration copied to $MCP_CONFIG_DIR/config.json"
    else
        print_error "mcp-config.json not found in current directory"
        exit 1
    fi
}

# Create environment file template
create_env_template() {
    print_status "Creating environment variables template..."

    cat > .env.template << 'EOF'
# Email Configuration
EMAIL_USER=your@domain.com
EMAIL_PASSWORD=your_email_password

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_database_url
REDIS_URL=your_redis_url

# Monitoring
SENTRY_DSN=your_sentry_dsn

# Deployment
HEROKU_API_KEY=your_heroku_api_key
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
EOF

    print_success "Environment template created: .env.template"
    print_warning "Please copy .env.template to .env and fill in your actual credentials"
}

# Test MCP installation
test_mcps() {
    print_status "Testing MCP installations..."

    # Test core MCPs
    print_status "Testing core MCPs..."
    npx -y @upstash/context7-mcp --help > /dev/null 2>&1 && print_success "Context7 MCP working" || print_warning "Context7 MCP test failed"
    npx -y @modelcontextprotocol/server-sequential-thinking --help > /dev/null 2>&1 && print_success "Sequential Thinking MCP working" || print_warning "Sequential Thinking MCP test failed"
    npx -y @modelcontextprotocol/server-filesystem --help > /dev/null 2>&1 && print_success "Filesystem MCP working" || print_warning "Filesystem MCP test failed"
    npx -y @agent-infra/mcp-server-browser --help > /dev/null 2>&1 && print_success "Browser MCP working" || print_warning "Browser MCP test failed"

    # Test service MCPs
    print_status "Testing service MCPs..."
    npx -y @supabase/mcp-server-supabase --help > /dev/null 2>&1 && print_success "Supabase MCP working" || print_warning "Supabase MCP test failed"
    npx -y @sentry/mcp-server --help > /dev/null 2>&1 && print_success "Sentry MCP working" || print_warning "Sentry MCP test failed"
    npx -y @heroku/mcp-server --help > /dev/null 2>&1 && print_success "Heroku MCP working" || print_warning "Heroku MCP test failed"
}

# Show next steps
show_next_steps() {
    echo ""
    echo "🎉 MCP Setup Complete!"
    echo ""
    echo "Next steps:"
    echo "1. Copy .env.template to .env and fill in your credentials:"
    echo "   cp .env.template .env"
    echo ""
    echo "2. Restart Cursor to load the new MCP configuration"
    echo ""
    echo "3. Test your email integration:"
    echo "   node -e \"console.log('Testing email client...')\""
    echo ""
    echo "4. Available MCPs for your project:"
    echo "   - context7: Documentation and code examples"
    echo "   - sequentialthinking: Advanced problem-solving"
    echo "   - filesystem: File system access"
    echo "   - browser: Web browser automation"
    echo "   - email: Email operations (if available)"
    echo "   - imap: IMAP email access (if available)"
    echo "   - puppeteer: Browser automation (if available)"
    echo "   - supabase: Database operations"
    echo "   - sentry: Error monitoring"
    echo "   - heroku: Deployment"
    echo ""
    echo "5. Check MCP configuration:"
    echo "   cat ~/.cursor/mcp/config.json"
    echo ""
}

# Main execution
main() {
    echo "=========================================="
    echo "  MCP Setup for Email Integration Project"
    echo "=========================================="
    echo ""

    check_dependencies
    install_mcps
    setup_config
    create_env_template
    test_mcps
    show_next_steps
}

# Run main function
main "$@"
