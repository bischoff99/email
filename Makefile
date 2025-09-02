.PHONY: help install dev test build clean docker-up docker-down

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*##"; printf "\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  %-15s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

install: ## Install dependencies
	pnpm install

dev: ## Start development server
	pnpm run dev

dev-debug: ## Start development server with debugging
	pnpm run dev:debug

test: ## Run tests
	pnpm test

test-watch: ## Run tests in watch mode
	pnpm run test:watch

test-coverage: ## Run tests with coverage
	pnpm run test:coverage

lint: ## Run linter
	pnpm run lint

lint-fix: ## Fix linting issues
	pnpm run lint:fix

format: ## Format code
	pnpm run format

check: ## Run all checks (lint, format, test)
	pnpm run check

validate: ## Validate project (full check with coverage)
	pnpm run validate

clean: ## Clean project
	pnpm run clean

reinstall: ## Clean and reinstall
	pnpm run reinstall

docker-build: ## Build Docker image
	pnpm run docker:build

docker-up: ## Start Docker containers
	pnpm run docker:compose

docker-down: ## Stop Docker containers
	pnpm run docker:stop

docker-logs: ## View Docker logs
	pnpm run docker:logs

analyze: ## Analyze dependencies for circular references
	pnpm run analyze

deps-check: ## Check for dependency updates
	pnpm run deps:check

deps-update: ## Update dependencies
	pnpm run deps:update

setup: ## Initial project setup
	@echo "Setting up project..."
	@cp .env.example .env 2>/dev/null || echo ".env already exists"
	@pnpm install
	@pnpm dlx husky install
	@echo "Project setup complete!"

commit: ## Commit changes (runs pre-commit hooks)
	@git add -A
	@git commit

push: ## Push to remote
	@git push

quick-fix: ## Quick fix: format, lint-fix, and test
	@pnpm run format
	@pnpm run lint:fix
	@pnpm test