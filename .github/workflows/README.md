# GitHub Actions Workflows

This directory contains all GitHub Actions workflows for the Email Integration Server project. These workflows provide comprehensive CI/CD, security, quality assurance, and maintenance automation.

## 🚀 Workflows Overview

### Core CI/CD Pipeline

#### [`ci-cd.yml`](./ci-cd.yml) - Main CI/CD Pipeline
- **Triggers**: Push to `main`/`develop`, Pull Requests
- **Features**:
  - Smart change detection for optimized builds
  - Multi-Node.js version testing (18.x, 20.x)
  - Cross-platform testing (Ubuntu, Windows, macOS)
  - Docker build and testing
  - Performance benchmarking
  - Automated deployment to staging/production

### Security & Quality

#### [`codeql.yml`](./codeql.yml) - CodeQL Security Analysis
- **Triggers**: Push, PRs, Weekly schedule
- **Features**:
  - Advanced security scanning
  - Vulnerability detection
  - Security-extended queries
  - Automated security reports

#### [`security.yml`](./security.yml) - Dependency Security
- **Triggers**: Push, PRs, Weekly schedule
- **Features**:
  - npm audit security scanning
  - Snyk vulnerability analysis
  - Critical vulnerability blocking
  - SARIF security reports

#### [`quality.yml`](./quality.yml) - Code Quality Analysis
- **Triggers**: Push, PRs
- **Features**:
  - ESLint analysis with detailed reporting
  - Code complexity analysis
  - Test coverage validation
  - SonarCloud integration
  - Quality gate enforcement

### Automation & Maintenance

#### [`dependencies.yml`](./dependencies.yml) - Dependency Management
- **Triggers**: Weekly schedule, Manual dispatch
- **Features**:
  - Automated dependency updates (patch/minor/major)
  - License compliance checking
  - Security audit after updates
  - Automated PR creation

#### [`release.yml`](./release.yml) - Release Automation
- **Triggers**: Version tags, Manual dispatch
- **Features**:
  - Automated changelog generation
  - Docker image creation
  - Release asset management
  - Deployment orchestration

#### [`pr-management.yml`](./pr-management.yml) - PR Management
- **Triggers**: PR events
- **Features**:
  - Semantic PR title validation
  - Auto-labeling based on changes
  - PR size analysis
  - Breaking change detection
  - Status comment updates

#### [`stale.yml`](./stale.yml) - Issue/PR Lifecycle
- **Triggers**: Daily schedule, Manual dispatch
- **Features**:
  - Stale issue/PR management
  - Automated cleanup with grace periods
  - Repository metrics generation
  - Branch cleanup assistance

## 🔧 Configuration

### Required Secrets

Add these secrets to your repository settings:

```
CODECOV_TOKEN          # For coverage reporting
SONAR_TOKEN           # For SonarCloud analysis
SNYK_TOKEN           # For Snyk security scanning
```

### Optional Secrets

```
SLACK_WEBHOOK         # For notification integration
DISCORD_WEBHOOK       # For Discord notifications
```

### Environment Variables

Set these in your workflow environments:

```
API_KEYS              # Comma-separated API keys for testing
EMAIL_USER            # Test email configuration
EMAIL_PASSWORD        # Test email password
```

## 📊 Quality Gates

### Coverage Requirements
- **Minimum coverage**: 80%
- **Coverage reports**: lcov format
- **Integration**: Codecov

### Security Requirements
- **No critical vulnerabilities** in dependencies
- **CodeQL analysis** must pass
- **License compliance** verified

### Code Quality Requirements
- **Zero ESLint errors** (warnings allowed)
- **Prettier formatting** enforced
- **Complexity analysis** monitored

## 🚀 Deployment Strategy

### Environments
1. **Development**: Feature branches
2. **Staging**: `develop` branch auto-deployment
3. **Production**: `main` branch with manual approval

### Release Process
1. Create version tag (`v1.2.3`)
2. Automated release workflow triggers
3. Full test suite execution
4. Docker image creation
5. Release notes generation
6. Deployment to staging (optional)

## 📈 Monitoring & Reporting

### Automated Reports
- **Security**: Weekly vulnerability scans
- **Dependencies**: Weekly update checks
- **Quality**: Per-commit analysis
- **Performance**: Main branch benchmarks

### Notifications
- **PR Status**: Automated comments
- **Security Issues**: Immediate alerts
- **Deployment**: Success/failure notifications
- **Maintenance**: Weekly summaries

## 🛠️ Local Development

### Running Workflows Locally
```bash
# Install act for local workflow testing
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run specific workflow
act -j test -s GITHUB_TOKEN=your_token

# Run with specific event
act pull_request -s GITHUB_TOKEN=your_token
```

### Validating Workflow Changes
```bash
# Validate workflow syntax
yamllint .github/workflows/*.yml

# Check action versions
actionlint .github/workflows/*.yml
```

## 📚 Best Practices

### Workflow Design
- ✅ Use smart change detection
- ✅ Implement proper caching
- ✅ Fail fast for quick feedback
- ✅ Use matrix strategies for coverage
- ✅ Include cleanup steps

### Security
- ✅ Use minimal required permissions
- ✅ Pin action versions to specific commits
- ✅ Store sensitive data in secrets
- ✅ Validate inputs and outputs
- ✅ Use OIDC for cloud deployments

### Performance
- ✅ Cache dependencies aggressively
- ✅ Run jobs in parallel when possible
- ✅ Use conditional execution
- ✅ Optimize Docker builds
- ✅ Minimize artifact retention

## 🔄 Maintenance

### Regular Updates
- **Monthly**: Review and update action versions
- **Quarterly**: Analyze workflow performance
- **Bi-annually**: Security audit of workflows
- **Annually**: Complete workflow review

### Monitoring
- Track workflow success rates
- Monitor execution times
- Review resource usage
- Analyze failure patterns

---

For questions or improvements, please open an issue or submit a pull request! 🚀