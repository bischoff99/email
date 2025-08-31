# MCP Setup Guide for Linux/WSL2

This guide shows how to set up the same Model Context Protocol (MCP) servers that Cursor uses on Windows in your Linux/WSL2 environment.

## What are MCPs?

Model Context Protocol (MCP) servers provide AI assistants with access to external tools and data sources. They allow Cursor to interact with various services and APIs directly.

## Current MCP Configuration

Your MCP configuration is located at `~/.cursor/mcp.json` and includes the following servers:

### Core MCP Servers

- **Context7** (`@upstash/context7-mcp`): Access to documentation and code examples
- **Sequential Thinking** (`@modelcontextprotocol/server-sequential-thinking`): Advanced problem-solving capabilities
- **Filesystem** (`@modelcontextprotocol/server-filesystem`): File system access and manipulation
- **Browser** (`@agent-infra/mcp-server-browser`): Web browser automation and access

### Service-Specific MCP Servers

- **Notion** (`@notionhq/notion-mcp-server`): Notion API integration
- **Supabase** (`@supabase/mcp-server-supabase`): Supabase database operations
- **Sentry** (`@sentry/mcp-server`): Error tracking and monitoring
- **Heroku** (`@heroku/mcp-server`): Heroku platform management

## Installation Status

✅ **Node.js and npm**: Installed (v22.19.0 / 10.9.3)
✅ **MCP Configuration**: Updated at `~/.cursor/mcp.json`
✅ **Context7 MCP**: Tested and working
✅ **Sequential Thinking MCP**: Tested and working
✅ **Console Ninja MCP**: Already configured
✅ **Filesystem MCP**: Configured for `/home/bischoff666/projects`
✅ **Fetch MCP**: Already configured with custom path

## How to Use MCPs

1. **Restart Cursor**: After setting up MCPs, restart Cursor to load the new configuration
2. **Authentication**: Some MCPs require API keys (Notion, Supabase, etc.)
3. **Usage**: MCPs are automatically available when you interact with the AI assistant

## Adding More MCPs

To add additional MCP servers:

1. Find the package name from npm registry
2. Add to `~/.cursor/mcp/config.json`:

```json
"server-name": {
  "command": "npx",
  "args": ["-y", "package-name"],
  "env": {}
}
```

## Available MCP Servers

Here are some additional MCPs you can add:

### Development Tools

- `@mapbox/mcp-server` - Mapbox services
- `@browserstack/mcp-server` - BrowserStack testing
- `@alchemy/mcp-server` - Alchemy blockchain APIs
- `mcp-server-code-runner` - Code execution

### Documentation & Knowledge

- `@hubspot/mcp-server` - HubSpot integration
- `youtube-data-mcp-server` - YouTube data access
- `graphlit-mcp-server` - Graphlit AI platform

## Troubleshooting

### Common Issues

1. **MCP not loading**: Restart Cursor after configuration changes
2. **Authentication errors**: Set up API keys for service-specific MCPs
3. **Network issues**: Ensure internet connectivity for npm package downloads

### Verification Commands

```bash
# Test MCP server installation
npx -y @upstash/context7-mcp --help

# Check MCP configuration
cat ~/.cursor/mcp/config.json

# List available MCP packages
npm search mcp-server
```

## Next Steps

1. Restart Cursor to load the MCP configuration
2. Test MCP functionality by asking the AI assistant to use specific tools
3. Set up API keys for services you want to use (Notion, Supabase, etc.)
4. Add additional MCPs as needed for your workflow

## Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [Cursor MCP Documentation](https://cursor.sh/docs/mcp)
- [npm MCP Server Registry](https://www.npmjs.com/search?q=mcp-server)
