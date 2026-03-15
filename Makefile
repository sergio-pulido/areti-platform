.PHONY: help install dev build test lint clean tree structure deps-update deps-check format type-check

# Default target
help:
	@echo "Available commands:"
	@echo "  install        Install all dependencies"
	@echo "  dev            Start development servers"
	@echo "  build          Build all packages and apps"
	@echo "  test           Run all tests"
	@echo "  lint           Run linting"
	@echo "  format         Format code"
	@echo "  type-check     Run type checking"
	@echo "  clean          Clean build artifacts and dependencies"
	@echo "  tree           Generate project structure tree"
	@echo "  structure      Generate structure.txt file"
	@echo "  deps-update    Update dependencies"
	@echo "  deps-check     Check for outdated dependencies"
	@echo "  db-reset       Reset database"
	@echo "  db-migrate     Run database migrations"
	@echo "  db-seed        Seed database with sample data"

# Install dependencies
install:
	pnpm install

# Start development servers
dev:
	pnpm dev

# Build all packages and apps
build:
	pnpm build

# Run all tests
test:
	pnpm test

# Run linting
lint:
	pnpm lint

# Format code
format:
	pnpm format

# Type checking
type-check:
	pnpm type-check

# Clean build artifacts and dependencies
clean:
	rm -rf node_modules
	rm -rf apps/*/node_modules
	rm -rf packages/*/node_modules
	rm -rf apps/*/dist
	rm -rf packages/*/dist
	rm -rf .turbo
	pnpm install

# Generate project structure tree (display only)
tree:
	@echo "Project Structure:"
	@tree -I 'node_modules|.git|dist|build|.turbo' --dirsfirst

# Generate structure.txt file
structure:
	@echo "Generating structure.txt..."
	@tree -I 'node_modules|.git|dist|build|.turbo' --dirsfirst > structure.txt
	@echo "Structure saved to structure.txt"
	@cat structure.txt

# Update dependencies
deps-update:
	pnpm update --latest
	pnpm install

# Check for outdated dependencies
deps-check:
	pnpm outdated

# Database operations
db-reset:
	@echo "Resetting database..."
	cd apps/api && pnpm db:reset

db-migrate:
	@echo "Running database migrations..."
	cd apps/api && pnpm db:migrate

db-seed:
	@echo "Seeding database..."
	cd apps/api && pnpm db:seed

# Docker commands
docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

# Git utilities
git-clean:
	@echo "Cleaning untracked files..."
	git clean -fd

git-status:
	@echo "Git status with ignored files:"
	git status --ignored

# Find large files
find-large:
	@echo "Finding files larger than 1MB..."
	find . -type f -size +1M -not -path "./node_modules/*" -not -path "./.git/*" -exec ls -lh {} \;

# Search utilities
search-imports:
	@echo "Searching for import statements..."
	rg "^import|^export" --type ts --type js

search-types:
	@echo "Searching for TypeScript type definitions..."
	rg "type|interface" --type ts

# Development utilities
watch-api:
	cd apps/api && pnpm dev

watch-web:
	cd apps/web && pnpm dev

# Package utilities
build-api:
	cd apps/api && pnpm build

build-web:
	cd apps/web && pnpm build

test-api:
	cd apps/api && pnpm test

test-web:
	cd apps/web && pnpm test

# Documentation
docs-serve:
	@echo "Starting documentation server..."
	@echo "Add your docs server command here"

docs-build:
	@echo "Building documentation..."
	@echo "Add your docs build command here"