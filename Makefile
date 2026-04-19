.PHONY: help build up down logs status clean test shell-db shell-backend shell-frontend rebuild restart backup restore

help:
	@echo "OrganizeMe Docker Management"
	@echo "============================"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  build           - Build all services"
	@echo "  up              - Start all services"
	@echo "  down            - Stop all services"
	@echo "  restart         - Restart all services"
	@echo "  rebuild         - Rebuild and restart all services"
	@echo "  logs            - View logs from all services"
	@echo "  logs-backend    - View backend logs"
	@echo "  logs-frontend   - View frontend logs"
	@echo "  logs-db         - View database logs"
	@echo "  status          - Show service status"
	@echo "  ps              - Alias for status"
	@echo "  shell-db        - Connect to PostgreSQL shell"
	@echo "  shell-backend   - Get shell access to backend container"
	@echo "  shell-frontend  - Get shell access to frontend container"
	@echo "  shell-jenkins   - Get shell access to Jenkins container"
	@echo "  shell-terraform - Get shell access to Terraform container"
	@echo "  jenkins-init    - Initialize Jenkins (first time setup)"
	@echo "  terraform-init  - Initialize Terraform"
	@echo "  terraform-plan  - Plan Terraform changes"
	@echo "  terraform-apply - Apply Terraform changes"
	@echo "  terraform-destroy - Destroy Terraform resources"
	@echo "  aws-init        - Initialize AWS deployment"
	@echo "  test            - Run tests"
	@echo "  clean           - Stop and remove volumes (DESTRUCTIVE)"
	@echo "  backup          - Backup database"
	@echo "  restore         - Restore database from backup"
	@echo "  env             - Create .env from .env.example"
	@echo "  prod-up         - Start production environment"
	@echo "  prod-down       - Stop production environment"

# Build
build:
	@echo "Building all services..."
	docker-compose build

# Start/Stop
up:
	@echo "Starting services..."
	docker-compose up -d
	@sleep 3
	@make status

down:
	@echo "Stopping services..."
	docker-compose down

restart:
	@echo "Restarting services..."
	docker-compose restart
	@sleep 2
	@make status

rebuild:
	@echo "Rebuilding and restarting services..."
	docker-compose up -d --build

# Logs
logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-db:
	docker-compose logs -f postgres

# Status
status:
	@echo "Service Status:"
	docker-compose ps
	@echo ""
	@echo "Access URLs:"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:5000"
	@echo "  Database: localhost:5432"

ps: status

# Shell Access
shell-db:
	docker-compose exec postgres psql -U admin -d organizeme

shell-backend:
	docker-compose exec backend sh

shell-frontend:
	docker-compose exec frontend sh

shell-jenkins:
	docker-compose exec jenkins bash

shell-terraform:
	docker-compose exec terraform sh

# Jenkins
jenkins-init:
	@echo "Initializing Jenkins..."
	docker-compose up -d jenkins
	@echo "Jenkins will be available at http://localhost:8080"
	@echo "Default credentials: admin / admin123"

# Terraform
terraform-init:
	@echo "Initializing Terraform..."
	docker-compose exec terraform terraform init

terraform-plan:
	@echo "Planning Terraform changes..."
	docker-compose exec terraform terraform plan

terraform-apply:
	@echo "Applying Terraform changes..."
	docker-compose exec terraform terraform apply

terraform-destroy:
	@echo "Destroying Terraform resources..."
	docker-compose exec terraform terraform destroy

aws-init:
	@echo "Initializing AWS deployment..."
	@echo "Make sure you have:"
	@echo "1. AWS credentials configured (aws configure)"
	@echo "2. SSH key pair created in AWS Console"
	@echo "3. terraform.tfvars configured"
	@echo ""
	docker-compose exec terraform terraform init
	docker-compose exec terraform terraform validate

# Testing
test:
	@echo "Running tests..."
	docker-compose exec backend npm test

# Cleanup
clean:
	@echo "WARNING: This will remove all containers and volumes!"
	@read -p "Are you sure? (yes/no) " confirm && \
	if [ "$$confirm" = "yes" ]; then \
		docker-compose down -v; \
		echo "Cleanup complete"; \
	fi

# Database Operations
backup:
	@echo "Backing up database..."
	mkdir -p backups
	docker-compose exec postgres pg_dump -U admin organizeme > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Backup created in backups/"

restore:
	@read -p "Enter backup filename: " backup_file && \
	docker-compose exec -T postgres psql -U admin organizeme < backups/$$backup_file && \
	echo "Restore complete"

# Environment
env:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo ".env file created from .env.example"; \
		echo "Please edit .env with your configuration"; \
	else \
		echo ".env file already exists"; \
	fi

# Production
prod-up:
	@echo "Starting production environment..."
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
	@sleep 3
	@make status

prod-down:
	@echo "Stopping production environment..."
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

# Development
dev-up: up logs

dev-clean: down
	docker system prune -f

# Install frontend dependencies
frontend-install:
	docker-compose ps frontend > /dev/null 2>&1 && \
	docker-compose exec frontend npm install || \
	echo "Frontend service not running. Start with 'make up' first"

# Install backend dependencies
backend-install:
	docker-compose ps backend > /dev/null 2>&1 && \
	docker-compose exec backend npm install || \
	echo "Backend service not running. Start with 'make up' first"

# Update all dependencies
update-deps: backend-install frontend-install

# Health check
health:
	@echo "Checking service health..."
	@docker-compose exec -T postgres pg_isready -U admin > /dev/null 2>&1 && echo "✓ PostgreSQL: OK" || echo "✗ PostgreSQL: FAILED"
	@docker-compose exec -T backend curl -s http://localhost:5000 > /dev/null 2>&1 && echo "✓ Backend: OK" || echo "✗ Backend: FAILED"
	@docker-compose exec -T frontend wget -q -O - http://localhost > /dev/null 2>&1 && echo "✓ Frontend: OK" || echo "✗ Frontend: FAILED"
