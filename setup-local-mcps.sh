#!/bin/bash

# Local MCP Setup Script for Email Integration Project
# This script installs MCP servers locally to avoid permission issues

set -e

echo "🔧 Setting up Local MCPs for Email Integration Project..."

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

# Install MCP servers locally
install_local_mcps() {
    print_status "Installing MCP servers locally..."
    
    # Core MCPs
    print_status "Installing core MCPs..."
    npm install @upstash/context7-mcp
    npm install @modelcontextprotocol/server-sequential-thinking
    npm install @modelcontextprotocol/server-filesystem
    npm install @agent-infra/mcp-server-browser
    
    # Service MCPs
    print_status "Installing service MCPs..."
    npm install @supabase/mcp-server-supabase
    npm install @sentry/mcp-server
    npm install @heroku/mcp-server
    
    # Optional MCPs (will skip if not available)
    print_status "Installing optional MCPs..."
    npm install mcp-server-email || print_warning "mcp-server-email not found, skipping..."
    npm install mcp-server-imap || print_warning "mcp-server-imap not found, skipping..."
    npm install mcp-server-puppeteer || print_warning "mcp-server-puppeteer not found, skipping..."
    npm install mcp-server-http || print_warning "mcp-server-http not found, skipping..."
    npm install mcp-server-logging || print_warning "mcp-server-logging not found, skipping..."
    npm install mcp-server-docker || print_warning "mcp-server-docker not found, skipping..."
    
    print_success "Local MCP servers installation completed"
}

# Update MCP configuration for local installation
update_mcp_config() {
    print_status "Updating MCP configuration for local installation..."
    
    # Create local MCP config
    cat > mcp-config-local.json << 'EOF'
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["@upstash/context7-mcp"],
      "env": {}
    },
    "sequentialthinking": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-sequential-thinking"],
      "env": {}
    },
    "filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem"],
      "env": {}
    },
    "browser": {
      "command": "npx",
      "args": ["@agent-infra/mcp-server-browser"],
      "env": {}
    },
    "supabase": {
      "command": "npx",
      "args": ["@supabase/mcp-server-supabase"],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_ANON_KEY": "${SUPABASE_ANON_KEY}"
      }
    },
    "sentry": {
      "command": "npx",
      "args": ["@sentry/mcp-server"],
      "env": {
        "SENTRY_DSN": "${SENTRY_DSN}"
      }
    },
    "heroku": {
      "command": "npx",
      "args": ["@heroku/mcp-server"],
      "env": {
        "HEROKU_API_KEY": "${HEROKU_API_KEY}"
      }
    }
  }
}
EOF
    
    # Copy to Cursor MCP directory
    cp mcp-config-local.json ~/.cursor/mcp/config.json
    print_success "MCP configuration updated for local installation"
}

# Test MCP installation
test_local_mcps() {
    print_status "Testing local MCP installations..."
    
    # Test core MCPs
    print_status "Testing core MCPs..."
    npx @upstash/context7-mcp --help > /dev/null 2>&1 && print_success "Context7 MCP working" || print_warning "Context7 MCP test failed"
    npx @modelcontextprotocol/server-sequential-thinking --help > /dev/null 2>&1 && print_success "Sequential Thinking MCP working" || print_warning "Sequential Thinking MCP test failed"
    npx @modelcontextprotocol/server-filesystem --help > /dev/null 2>&1 && print_success "Filesystem MCP working" || print_warning "Filesystem MCP test failed"
    npx @agent-infra/mcp-server-browser --help > /dev/null 2>&1 && print_success "Browser MCP working" || print_warning "Browser MCP test failed"
    
    # Test service MCPs
    print_status "Testing service MCPs..."
    npx @supabase/mcp-server-supabase --help > /dev/null 2>&1 && print_success "Supabase MCP working" || print_warning "Supabase MCP test failed"
    npx @sentry/mcp-server --help > /dev/null 2>&1 && print_success "Sentry MCP working" || print_warning "Sentry MCP test failed"
    npx @heroku/mcp-server --help > /dev/null 2>&1 && print_success "Heroku MCP working" || print_warning "Heroku MCP test failed"
}

# Show next steps
show_next_steps() {
    echo ""
    echo "🎉 Local MCP Setup Complete!"
    echo ""
    echo "Next steps:"
    echo "1. Restart Cursor to load the new MCP configuration"
    echo ""
    echo "2. Test your email integration:"
    echo "   npm test"
    echo ""
    echo "3. Start the development server:"
    echo "   npm run dev"
    echo ""
    echo "4. Available MCPs for your project:"
    echo "   - context7: Documentation and code examples"
    echo "   - sequentialthinking: Advanced problem-solving"
    echo "   - filesystem: File system access"
    echo "   - browser: Web browser automation"
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
    echo "  Local MCP Setup for Email Integration Project"
    echo "=========================================="
    echo ""
    
    install_local_mcps
    update_mcp_config
    test_local_mcps
    show_next_steps
}

# Run main function
main "$@"


