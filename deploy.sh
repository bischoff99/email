#!/bin/bash

# Email Integration Server Deployment Script
# Usage: ./deploy.sh [dev|staging|prod]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default environment
ENV=${1:-staging}

echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}Email Integration Server Deployment${NC}"
echo -e "${GREEN}Environment: ${YELLOW}$ENV${NC}"
echo -e "${GREEN}===========================================${NC}"

# Validate environment
if [[ ! "$ENV" =~ ^(dev|staging|prod)$ ]]; then
    echo -e "${RED}Error: Invalid environment. Use 'dev', 'staging', or 'prod'${NC}"
    exit 1
fi

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Warning: .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${RED}Please update .env file with your actual configuration before proceeding.${NC}"
    exit 1
fi

# Validate configuration
echo -e "\n${YELLOW}Validating configuration...${NC}"

# Check required environment variables
required_vars=("EMAIL_USER" "EMAIL_PASSWORD")
missing_vars=()

for var in "${required_vars[@]}"; do
    if ! grep -q "^$var=" .env || grep -q "^$var=your-" .env; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo -e "${RED}Error: Missing or invalid configuration for: ${missing_vars[*]}${NC}"
    echo -e "${RED}Please update your .env file with actual values.${NC}"
    exit 1
fi

# Run tests
echo -e "\n${YELLOW}Running tests...${NC}"
if ! pnpm test; then
    echo -e "${RED}Tests failed. Please fix the issues before deploying.${NC}"
    exit 1
fi

# Build Docker image
echo -e "\n${YELLOW}Building Docker image...${NC}"
docker build -t email-integration-server:$ENV .

# Stop existing containers
echo -e "\n${YELLOW}Stopping existing containers...${NC}"
docker-compose down

# Deploy based on environment
echo -e "\n${YELLOW}Deploying to $ENV environment...${NC}"

case $ENV in
    dev)
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
        ;;
    staging)
        docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d --build
        ;;
    prod)
        # For production, we might want to backup data first
        echo -e "${YELLOW}Creating backup...${NC}"
        mkdir -p backups
        timestamp=$(date +%Y%m%d_%H%M%S)
        docker-compose logs > "backups/logs_backup_$timestamp.txt" 2>&1 || true
        
        # Deploy production
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
        ;;
esac

# Wait for service to be healthy
echo -e "\n${YELLOW}Waiting for service to be healthy...${NC}"
sleep 5

# Check health status
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}Service is healthy!${NC}"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        echo -e "${RED}Service health check failed after $max_attempts attempts${NC}"
        echo -e "${YELLOW}Checking logs...${NC}"
        docker-compose logs --tail=50
        exit 1
    fi
    
    echo -e "Attempt $attempt/$max_attempts - Service not ready yet..."
    sleep 2
    attempt=$((attempt + 1))
done

# Show deployment info
echo -e "\n${GREEN}===========================================${NC}"
echo -e "${GREEN}Deployment Successful!${NC}"
echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}Environment: ${YELLOW}$ENV${NC}"
echo -e "${GREEN}Health Check: ${YELLOW}http://localhost:3000/health${NC}"
echo -e "${GREEN}API Docs: ${YELLOW}http://localhost:3000/api-docs${NC}"
echo -e "${GREEN}Logs: ${YELLOW}docker-compose logs -f${NC}"
echo -e "${GREEN}===========================================${NC}"

# Show container status
echo -e "\n${YELLOW}Container Status:${NC}"
docker-compose ps

# Show recent logs
echo -e "\n${YELLOW}Recent Logs:${NC}"
docker-compose logs --tail=10