# Love Claude Code - Makefile
# Simple commands to manage the entire application

# Variables & Configuration
SHELL := /bin/bash
.DEFAULT_GOAL := help
.PHONY: help

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;34m
MAGENTA := \033[0;35m
CYAN := \033[0;36m
WHITE := \033[0;37m
RESET := \033[0m

# Project settings
PROJECT_NAME := love-claude-code
NODE_ENV ?= development
FRONTEND_PORT := 3000
BACKEND_PORT := 8000
WEBSOCKET_PORT := 8001

# Detect OS for platform-specific commands
UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Darwin)
    OPEN_CMD := open
else
    OPEN_CMD := xdg-open
endif

#=============================================================================
# Help
#=============================================================================

help: ## Show this help message
	@printf "$(CYAN)Love Claude Code - Make Commands$(RESET)\n\n"
	@printf "$(WHITE)Usage:$(RESET)\n"
	@printf "  make $(YELLOW)[target]$(RESET)\n\n"
	@printf "$(WHITE)Primary Targets:$(RESET)\n"
	@grep -E '^[a-zA-Z_-]+:.*?## .*' $(MAKEFILE_LIST) | grep -E '^(dev|build|test|clean|setup):' | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(RESET) %s\n", $$1, $$2}'
	@printf "\n$(WHITE)Development:$(RESET)\n"
	@grep -E '^[a-zA-Z_-]+:.*?## .*' $(MAKEFILE_LIST) | grep -E '^(install|dev-[a-zA-Z_-]+|run-[a-zA-Z_-]+|switch-[a-zA-Z_-]+):' | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(RESET) %s\n", $$1, $$2}'
	@printf "\n$(WHITE)Testing & Quality:$(RESET)\n"
	@grep -E '^[a-zA-Z_-]+:.*?## .*' $(MAKEFILE_LIST) | grep -E '^(test-[a-zA-Z_-]+|lint|type-check|format|check):' | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(RESET) %s\n", $$1, $$2}'
	@printf "\n$(WHITE)Docker:$(RESET)\n"
	@grep -E '^docker-[a-zA-Z_-]+:.*?## .*' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(RESET) %s\n", $$1, $$2}'
	@printf "\n$(WHITE)Database:$(RESET)\n"
	@grep -E '^db-[a-zA-Z_-]+:.*?## .*' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(RESET) %s\n", $$1, $$2}'
	@printf "\n$(WHITE)MCP Provider Management:$(RESET)\n"
	@grep -E '^mcp-[a-zA-Z_-]+:.*?## .*' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(RESET) %s\n", $$1, $$2}'
	@printf "\n$(WHITE)Deployment:$(RESET)\n"
	@grep -E '^[a-zA-Z_-]+:.*?## .*' $(MAKEFILE_LIST) | grep -E '^(deploy-|infra-):' | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(RESET) %s\n", $$1, $$2}'
	@printf "\n$(WHITE)Utilities:$(RESET)\n"
	@grep -E '^[a-zA-Z_-]+:.*?## .*' $(MAKEFILE_LIST) | grep -E '^(security|analyze|docs|generate):' | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(RESET) %s\n", $$1, $$2}'
	@printf "\n$(WHITE)Provider Tools:$(RESET)\n"
	@grep -E '^[a-zA-Z_-]+:.*?## .*' $(MAKEFILE_LIST) | grep -E '^(firebase-emulator|localstack|test-providers):' | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(RESET) %s\n", $$1, $$2}'
	@printf "\n"

#=============================================================================
# Primary Targets
#=============================================================================

.PHONY: dev build test clean setup

dev: dev-local ## Start development with local provider (default)

dev-local: ## Start development with local provider (zero config!)
	@printf "$(CYAN)Starting Love Claude Code with Local Provider...$(RESET)\n"
	@printf "$(GREEN)✓ No configuration needed! All data stored locally.$(RESET)\n"
	@# Build MCP UI server if not already built
	@if [ ! -d mcp-server/dist ]; then \
		printf "$(YELLOW)Building MCP UI server...$(RESET)\n"; \
		cd mcp-server && npm install && npm run build; \
	fi
	@printf "$(MAGENTA)Frontend:$(RESET) http://localhost:$(FRONTEND_PORT)\n"
	@printf "$(MAGENTA)Backend:$(RESET)  http://localhost:$(BACKEND_PORT)\n"
	@printf "$(MAGENTA)API Docs:$(RESET) http://localhost:$(BACKEND_PORT)/api\n"
	@printf "$(MAGENTA)MCP Tools:$(RESET) http://localhost:$(BACKEND_PORT)/mcp\n"
	@printf "$(MAGENTA)MCP UI Server:$(RESET) Running for UI testing/interaction\n\n"
	@PROVIDER_TYPE=local npm run dev

dev-firebase: ## Start development with Firebase provider
	@printf "$(CYAN)Starting Love Claude Code with Firebase Provider...$(RESET)\n"
	@if ! command -v firebase >/dev/null 2>&1; then \
		printf "$(RED)Error: Firebase CLI not installed$(RESET)\n"; \
		printf "$(YELLOW)Run: npm install -g firebase-tools$(RESET)\n"; \
		exit 1; \
	fi
	@$(MAKE) firebase-emulator
	@PROVIDER_TYPE=firebase npm run dev

dev-aws: ## Start development with AWS provider
	@printf "$(CYAN)Starting Love Claude Code with AWS Provider...$(RESET)\n"
	@if ! docker info >/dev/null 2>&1; then \
		printf "$(RED)Error: Docker not running$(RESET)\n"; \
		exit 1; \
	fi
	@$(MAKE) localstack
	@PROVIDER_TYPE=aws npm run dev

switch-to-local: ## Switch to local provider
	@printf "$(CYAN)Switching to Local Provider...$(RESET)\n"
	@echo "PROVIDER_TYPE=local" > .env.provider
	@printf "$(GREEN)✓ Switched to Local provider$(RESET)\n"
	@printf "$(YELLOW)Restart your dev server to apply changes$(RESET)\n"

switch-to-firebase: ## Switch to Firebase provider
	@printf "$(CYAN)Switching to Firebase Provider...$(RESET)\n"
	@echo "PROVIDER_TYPE=firebase" > .env.provider
	@printf "$(GREEN)✓ Switched to Firebase provider$(RESET)\n"
	@printf "$(YELLOW)Configure Firebase settings in-app or .env.local$(RESET)\n"
	@printf "$(YELLOW)Restart your dev server to apply changes$(RESET)\n"

switch-to-aws: ## Switch to AWS provider
	@printf "$(CYAN)Switching to AWS Provider...$(RESET)\n"
	@echo "PROVIDER_TYPE=aws" > .env.provider
	@printf "$(GREEN)✓ Switched to AWS provider$(RESET)\n"
	@printf "$(YELLOW)Configure AWS credentials in-app or .env.local$(RESET)\n"
	@printf "$(YELLOW)Restart your dev server to apply changes$(RESET)\n"

build: ## Build all components for production
	@printf "$(CYAN)Building Love Claude Code for production...$(RESET)\n"
	@npm run build
	@printf "$(GREEN)✓ Build complete!$(RESET)\n"

test: ## Run all tests
	@printf "$(CYAN)Running all tests...$(RESET)\n"
	@npm run test
	@printf "$(GREEN)✓ All tests passed!$(RESET)\n"

clean: ## Clean all build artifacts and dependencies
	@printf "$(CYAN)Cleaning project...$(RESET)\n"
	@npm run clean
	@rm -rf node_modules package-lock.json
	@rm -rf frontend/node_modules frontend/package-lock.json
	@rm -rf backend/node_modules backend/package-lock.json
	@rm -rf infrastructure/node_modules infrastructure/package-lock.json
	@printf "$(GREEN)✓ Project cleaned!$(RESET)\n"

setup: ## Complete project setup (install + env + database)
	@printf "$(CYAN)Setting up Love Claude Code...$(RESET)\n"
	@make install
	@if [ ! -f .env.local ]; then \
		cp .env.example .env.local; \
		printf "$(GREEN)✓ Created .env.local with defaults$(RESET)\n"; \
	fi
	@printf "$(YELLOW)Building MCP UI server...$(RESET)\n"
	@cd mcp-server && npm run build
	@make db-start
	@sleep 3
	@make db-migrate
	@printf "$(GREEN)✓ Setup complete!$(RESET)\n"
	@printf "$(CYAN)Configure your API keys in-app via the Settings icon$(RESET)\n"
	@printf "$(CYAN)Run 'make dev' to start developing$(RESET)\n"

#=============================================================================
# Development
#=============================================================================

.PHONY: install dev-frontend dev-backend dev-docker dev-local dev-firebase dev-aws switch-to-local switch-to-firebase switch-to-aws run-frontend run-backend firebase-emulator localstack test-providers

install: ## Install all dependencies
	@printf "$(CYAN)Installing dependencies...$(RESET)\n"
	@npm install --ignore-scripts
	@cd frontend && npm install --ignore-scripts
	@cd backend && npm install --ignore-scripts
	@cd mcp-server && npm install --ignore-scripts
	@printf "$(GREEN)✓ Dependencies installed!$(RESET)\n"

dev-frontend: ## Start only frontend development server
	@printf "$(CYAN)Starting frontend development server...$(RESET)\n"
	@printf "$(MAGENTA)Frontend:$(RESET) http://localhost:$(FRONTEND_PORT)\n\n"
	@cd frontend && npm run dev

dev-backend: ## Start only backend development server
	@printf "$(CYAN)Starting backend development server...$(RESET)\n"
	@printf "$(MAGENTA)Backend API:$(RESET) http://localhost:$(BACKEND_PORT)\n\n"
	@cd backend && npm run dev

dev-docker: ## Start development with Docker
	@printf "$(CYAN)Starting Docker development environment...$(RESET)\n"
	@docker-compose -f docker-compose.dev.yml up

run-frontend: ## Run frontend in production mode
	@cd frontend && npm start

run-backend: ## Run backend in production mode
	@cd backend && npm start

#=============================================================================
# Testing & Quality
#=============================================================================

.PHONY: test-frontend test-backend test-e2e test-watch lint lint-fix type-check format check-all

test-frontend: ## Run frontend tests
	@printf "$(CYAN)Running frontend tests...$(RESET)\n"
	@cd frontend && npm test

test-backend: ## Run backend tests
	@printf "$(CYAN)Running backend tests...$(RESET)\n"
	@cd backend && npm test

test-e2e: ## Run end-to-end tests
	@printf "$(CYAN)Running E2E tests...$(RESET)\n"
	@npm run test:e2e

test-watch: ## Run tests in watch mode
	@npm run test:watch

lint: ## Run linting checks
	@printf "$(CYAN)Running linters...$(RESET)\n"
	@npm run lint

lint-fix: ## Fix linting issues automatically
	@printf "$(CYAN)Fixing linting issues...$(RESET)\n"
	@npm run lint:fix

type-check: ## Run TypeScript type checking
	@printf "$(CYAN)Checking TypeScript types...$(RESET)\n"
	@npm run type-check

format: ## Format all code with Prettier
	@printf "$(CYAN)Formatting code...$(RESET)\n"
	@npm run format

check-all: ## Run all checks (lint, type-check, test, format)
	@printf "$(CYAN)Running all checks...$(RESET)\n"
	@npm run check-all
	@printf "$(GREEN)✓ All checks passed!$(RESET)\n"

#=============================================================================
# Docker
#=============================================================================

.PHONY: docker-build docker-up docker-down docker-logs docker-clean docker-rebuild

docker-build: ## Build Docker images
	@printf "$(CYAN)Building Docker images...$(RESET)\n"
	@docker-compose build

docker-up: ## Start Docker services
	@printf "$(CYAN)Starting Docker services...$(RESET)\n"
	@docker-compose up -d
	@printf "$(GREEN)✓ Docker services started!$(RESET)\n"

docker-down: ## Stop Docker services
	@printf "$(CYAN)Stopping Docker services...$(RESET)\n"
	@docker-compose down

docker-logs: ## View Docker logs
	@docker-compose logs -f

docker-clean: ## Clean Docker volumes and images
	@printf "$(YELLOW)⚠ This will remove all Docker volumes and images!$(RESET)\n"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	printf "\n"; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v --rmi all; \
		printf "$(GREEN)✓ Docker cleaned!$(RESET)\n"; \
	fi

docker-rebuild: docker-clean docker-build docker-up ## Rebuild Docker environment from scratch

#=============================================================================
# Database
#=============================================================================

.PHONY: db-start db-stop db-migrate db-seed db-reset

db-start: ## Start database services
	@printf "$(CYAN)Starting database services...$(RESET)\n"
	@docker-compose up -d postgres redis
	@printf "$(GREEN)✓ Database services started!$(RESET)\n"

db-stop: ## Stop database services
	@printf "$(CYAN)Stopping database services...$(RESET)\n"
	@docker-compose stop postgres redis

db-migrate: ## Run database migrations
	@printf "$(CYAN)Running database migrations...$(RESET)\n"
	@cd backend && npm run db:migrate

db-seed: ## Seed database with sample data
	@printf "$(CYAN)Seeding database...$(RESET)\n"
	@cd backend && npm run db:seed

db-reset: db-stop ## Reset database (WARNING: destroys all data)
	@printf "$(YELLOW)⚠ This will destroy all database data!$(RESET)\n"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	printf "\n"; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v postgres redis; \
		make db-start; \
		sleep 5; \
		make db-migrate; \
		make db-seed; \
		printf "$(GREEN)✓ Database reset complete!$(RESET)\n"; \
	fi

#=============================================================================
# Deployment
#=============================================================================

.PHONY: deploy-dev deploy-staging deploy-prod deploy-rollback infra-diff infra-deploy

deploy-dev: check-all build ## Deploy to development environment
	@printf "$(CYAN)Deploying to development...$(RESET)\n"
	@cd infrastructure && npm run deploy:dev

deploy-staging: check-all build ## Deploy to staging environment
	@printf "$(CYAN)Deploying to staging...$(RESET)\n"
	@printf "$(YELLOW)⚠ Deploying to staging environment$(RESET)\n"
	@read -p "Continue? [y/N] " -n 1 -r; \
	printf "\n"; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		cd infrastructure && npm run deploy:staging; \
	fi

deploy-prod: check-all build ## Deploy to production environment
	@printf "$(CYAN)Deploying to production...$(RESET)\n"
	@printf "$(RED)⚠️  PRODUCTION DEPLOYMENT ⚠️$(RESET)\n"
	@read -p "Are you SURE you want to deploy to production? [y/N] " -n 1 -r; \
	printf "\n"; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		read -p "Type 'PRODUCTION' to confirm: " confirmation; \
		if [[ $$confirmation == "PRODUCTION" ]]; then \
			cd infrastructure && npm run deploy:prod; \
		else \
			printf "$(RED)✗ Deployment cancelled$(RESET)\n"; \
		fi \
	fi

deploy-rollback: ## Rollback the last deployment
	@printf "$(YELLOW)⚠ Rolling back deployment...$(RESET)\n"
	@cd infrastructure && npm run deploy:rollback

infra-diff: ## Show infrastructure changes
	@printf "$(CYAN)Checking infrastructure changes...$(RESET)\n"
	@cd infrastructure && cdk diff

infra-deploy: ## Deploy infrastructure changes
	@printf "$(CYAN)Deploying infrastructure...$(RESET)\n"
	@cd infrastructure && cdk deploy

#=============================================================================
# Utilities
#=============================================================================

.PHONY: security-check security-fix security-scan security-pre-commit analyze docs generate-component generate-api open logs

security-check: ## Run security audit
	@printf "$(CYAN)Running security audit...$(RESET)\n"
	@npm run security:audit

security-fix: ## Fix security vulnerabilities
	@printf "$(CYAN)Fixing security vulnerabilities...$(RESET)\n"
	@npm run security:fix

security-scan: ## Scan for secrets in code
	@printf "$(CYAN)Scanning for secrets...$(RESET)\n"
	@if command -v gitleaks >/dev/null 2>&1; then \
		gitleaks detect --verbose; \
	elif command -v detect-secrets >/dev/null 2>&1; then \
		detect-secrets scan; \
	else \
		printf "$(YELLOW)⚠ No secret scanning tool found$(RESET)\n"; \
		printf "$(YELLOW)Install gitleaks or detect-secrets for secret scanning$(RESET)\n"; \
		printf "$(YELLOW)  brew install gitleaks$(RESET)\n"; \
		printf "$(YELLOW)  pip install detect-secrets$(RESET)\n"; \
	fi

security-pre-commit: ## Install pre-commit hooks for security
	@printf "$(CYAN)Installing pre-commit hooks...$(RESET)\n"
	@if command -v pre-commit >/dev/null 2>&1; then \
		pre-commit install; \
		printf "$(GREEN)✓ Pre-commit hooks installed!$(RESET)\n"; \
	else \
		printf "$(YELLOW)Installing pre-commit...$(RESET)\n"; \
		pip install pre-commit; \
		pre-commit install; \
		printf "$(GREEN)✓ Pre-commit hooks installed!$(RESET)\n"; \
	fi

analyze: ## Analyze bundle sizes
	@printf "$(CYAN)Analyzing bundle sizes...$(RESET)\n"
	@npm run analyze

docs: ## Build and serve documentation
	@printf "$(CYAN)Building documentation...$(RESET)\n"
	@npm run docs:build
	@npm run docs:serve

generate-component: ## Generate a new React component
	@npm run generate:component

generate-api: ## Generate a new API endpoint
	@npm run generate:api

open: ## Open the application in browser
	@$(OPEN_CMD) http://localhost:$(FRONTEND_PORT)

logs: ## Show application logs
	@if [ -f logs/app.log ]; then \
		tail -f logs/app.log; \
	else \
		printf "$(RED)✗ No log file found$(RESET)\n"; \
	fi

#=============================================================================
# Electron Desktop App
#=============================================================================

.PHONY: electron electron-install electron-dev electron-build electron-dist electron-pack-mac electron-pack-win electron-pack-linux

electron-install: ## Install Electron dependencies
	@printf "$(CYAN)Installing Electron dependencies...$(RESET)\n"
	@npm install electron electron-builder electron-reloader --save-dev
	@printf "$(GREEN)✓ Electron dependencies installed!$(RESET)\n"

electron-dev: ## Start Electron app in development mode
	@printf "$(CYAN)Starting Electron app...$(RESET)\n"
	@if [ ! -f electron/main.js ]; then \
		printf "$(RED)Error: Electron main.js not found$(RESET)\n"; \
		exit 1; \
	fi
	@npm run electron:dev

electron: electron-dev ## Alias for electron-dev

electron-build: build-frontend ## Build Electron app for distribution
	@printf "$(CYAN)Building Electron app...$(RESET)\n"
	@npm run electron:build
	@printf "$(GREEN)✓ Electron app built successfully!$(RESET)\n"

electron-dist: build-frontend ## Build and package Electron app for all platforms
	@printf "$(CYAN)Building Electron distributables...$(RESET)\n"
	@npm run electron:dist
	@printf "$(GREEN)✓ Electron distributables created in dist/$(RESET)\n"

electron-pack-mac: build-frontend ## Package Electron app for macOS only
	@printf "$(CYAN)Packaging for macOS...$(RESET)\n"
	@npm run electron:dist -- --mac
	@printf "$(GREEN)✓ macOS package created!$(RESET)\n"

electron-pack-win: build-frontend ## Package Electron app for Windows only
	@printf "$(CYAN)Packaging for Windows...$(RESET)\n"
	@npm run electron:dist -- --win
	@printf "$(GREEN)✓ Windows package created!$(RESET)\n"

electron-pack-linux: build-frontend ## Package Electron app for Linux only
	@printf "$(CYAN)Packaging for Linux...$(RESET)\n"
	@npm run electron:dist -- --linux
	@printf "$(GREEN)✓ Linux package created!$(RESET)\n"

#=============================================================================
# Advanced
#=============================================================================

.PHONY: info env-check update-deps backup

info: ## Show project information
	@printf "$(CYAN)Love Claude Code - Project Information$(RESET)\n\n"
	@printf "$(WHITE)Node Version:$(RESET) $(shell node --version)\n"
	@printf "$(WHITE)NPM Version:$(RESET) $(shell npm --version)\n"
	@printf "$(WHITE)Current Branch:$(RESET) $(shell git branch --show-current)\n"
	@printf "$(WHITE)Last Commit:$(RESET) $(shell git log -1 --oneline)\n"
	@printf "$(WHITE)Environment:$(RESET) $(NODE_ENV)\n"
	@printf "\n"

env-check: ## Check environment configuration
	@printf "$(CYAN)Checking environment configuration...$(RESET)\n"
	@if [ ! -f .env.local ]; then \
		printf "$(YELLOW)⚠ No .env.local found - using defaults$(RESET)\n"; \
		printf "$(GREEN)✓ Configure credentials in-app via Settings$(RESET)\n"; \
	else \
		printf "$(GREEN)✓ .env.local found$(RESET)\n"; \
	fi
	@printf "$(CYAN)Note: API keys are now configured in-app via Settings$(RESET)\n"

update-deps: ## Update all dependencies to latest versions
	@printf "$(YELLOW)⚠ This will update all dependencies to their latest versions!$(RESET)\n"
	@read -p "Continue? [y/N] " -n 1 -r; \
	printf "\n"; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		npm update; \
		cd frontend && npm update; \
		cd ../backend && npm update; \
		printf "$(GREEN)✓ Dependencies updated!$(RESET)\n"; \
	fi

backup: ## Create a backup of the project
	@printf "$(CYAN)Creating project backup...$(RESET)\n"
	@tar -czf ../$(PROJECT_NAME)-backup-$$(date +%Y%m%d-%H%M%S).tar.gz \
		--exclude=node_modules \
		--exclude=dist \
		--exclude=.next \
		--exclude=coverage \
		--exclude=.env.local \
		.
	@printf "$(GREEN)✓ Backup created!$(RESET)\n"

#=============================================================================
# Provider-Specific Commands
#=============================================================================

firebase-emulator: ## Start Firebase emulator suite
	@printf "$(CYAN)Starting Firebase emulator suite...$(RESET)\n"
	@if [ ! -f firebase.json ]; then \
		printf "$(YELLOW)Creating Firebase configuration...$(RESET)\n"; \
		echo '{ "emulators": { "auth": { "port": 9099 }, "firestore": { "port": 8080 }, "storage": { "port": 9199 }, "functions": { "port": 5001 } } }' > firebase.json; \
	fi
	@firebase emulators:start --only auth,firestore,storage,functions

localstack: ## Start LocalStack for AWS local development
	@printf "$(CYAN)Starting LocalStack...$(RESET)\n"
	@docker run -d \
		--name localstack \
		-p 4566:4566 \
		-p 4510-4559:4510-4559 \
		-e SERVICES=s3,dynamodb,lambda,cognito,appsync \
		-e DEBUG=1 \
		-v /var/run/docker.sock:/var/run/docker.sock \
		localstack/localstack
	@printf "$(GREEN)✓ LocalStack started at http://localhost:4566$(RESET)\n"

test-providers: ## Run provider integration tests
	@printf "$(CYAN)Running provider integration tests...$(RESET)\n"
	@cd backend && npm run test:providers
	@printf "$(GREEN)✓ All provider tests passed!$(RESET)\n"

#=============================================================================
# MCP Provider Management
#=============================================================================

.PHONY: mcp-server mcp-test mcp-compare mcp-estimate mcp-health mcp-docs mcp-analyze mcp-ui-build mcp-ui-start mcp-ui-dev mcp-provider mcp-provider-build mcp-all

mcp-ui-build: ## Build MCP UI testing server
	@printf "$(CYAN)Building MCP UI server...$(RESET)\n"
	@cd mcp-server && npm run build
	@printf "$(GREEN)✓ MCP UI server built!$(RESET)\n"

mcp-ui-start: ## Start MCP UI testing server (production mode)
	@printf "$(CYAN)Starting MCP UI server...$(RESET)\n"
	@cd mcp-server && npm run start

mcp-ui-dev: ## Start MCP UI testing server (development mode)
	@printf "$(CYAN)Starting MCP UI server in development mode...$(RESET)\n"
	@cd mcp-server && npm run dev

mcp-provider: ## Start MCP server for provider management
	@printf "$(CYAN)Starting MCP Provider Server...$(RESET)\n"
	@printf "$(YELLOW)This server provides tools for managing backend providers$(RESET)\n"
	@cd backend && npm run mcp:provider

mcp-provider-build: ## Build MCP provider server
	@printf "$(CYAN)Building MCP Provider Server...$(RESET)\n"
	@cd backend && npm run mcp:provider:build
	@printf "$(GREEN)✓ MCP Provider server built!$(RESET)\n"

mcp-all: ## Start both UI and Provider MCP servers
	@printf "$(CYAN)Starting all MCP servers...$(RESET)\n"
	@printf "$(MAGENTA)UI Testing Server:$(RESET) For interacting with Love Claude Code UI\n"
	@printf "$(MAGENTA)Provider Server:$(RESET) For managing backend providers\n\n"
	@concurrently \
		"make mcp-ui-dev" \
		"make mcp-provider" \
		--names "MCP-UI,MCP-Provider" \
		--prefix "[{name}]" \
		--prefix-colors "cyan,magenta"

mcp-test: ## Test MCP tools and integrations
	@printf "$(CYAN)Testing MCP provider tools...$(RESET)\n"
	@cd backend && npm run test:mcp
	@printf "$(GREEN)✓ MCP tests passed!$(RESET)\n"

mcp-compare: ## Interactive provider comparison
	@printf "$(CYAN)Provider Comparison Tool$(RESET)\n\n"
	@printf "$(WHITE)Available Providers:$(RESET)\n"
	@printf "  • $(GREEN)Local$(RESET) - Zero config, development friendly\n"
	@printf "  • $(YELLOW)Firebase$(RESET) - Real-time, rapid prototyping\n"
	@printf "  • $(BLUE)AWS$(RESET) - Enterprise scale, full control\n\n"
	@node scripts/mcp-compare.js

mcp-estimate: ## Estimate costs for your project
	@printf "$(CYAN)Cost Estimation Tool$(RESET)\n\n"
	@read -p "Expected users (e.g., 10000): " users; \
	read -p "Project type (web/mobile/api/fullstack): " type; \
	read -p "Data volume (low/medium/high): " volume; \
	node scripts/mcp-estimate.js $$users $$type $$volume

mcp-health: ## Check health of all providers
	@printf "$(CYAN)Provider Health Check$(RESET)\n\n"
	@curl -s http://localhost:$(BACKEND_PORT)/api/mcp/health | jq '.data.providers' || \
		printf "$(RED)✗ MCP server not running. Run 'make mcp-server' first$(RESET)\n"

mcp-docs: ## Open MCP documentation
	@printf "$(CYAN)Opening MCP documentation...$(RESET)\n"
	@$(OPEN_CMD) docs/MCP_PROVIDER_SYSTEM.md

mcp-analyze: ## Analyze project and recommend provider
	@printf "$(CYAN)Project Analysis Tool$(RESET)\n\n"
	@printf "This tool will analyze your project and recommend the best provider.\n\n"
	@read -p "Project directory (default: .): " dir; \
	dir=$${dir:-.}; \
	node scripts/mcp-analyze.js $$dir

# Tab completion support
.PHONY: _complete
_complete:
	@make -qp | awk -F':' '/^[a-zA-Z0-9][^$$#\/\t=]*:([^=]|$$)/ {split($$1,A,/ /);for(i in A)print A[i]}'