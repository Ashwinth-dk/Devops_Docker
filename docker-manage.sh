#!/bin/bash

# OrganizeMe Docker Startup Script
# This script provides easy commands to manage the Docker application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    print_success "Docker is installed"
}

# Check if Docker daemon is running
check_docker_daemon() {
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker."
        exit 1
    fi
    print_success "Docker daemon is running"
}

# Function to check if .env file exists
check_env_file() {
    if [ ! -f ".env" ]; then
        print_warning ".env file not found"
        print_info "Creating .env from .env.example..."
        cp .env.example .env
        print_success ".env file created"
        print_info "Please edit .env with your configuration"
    fi
}

# Display menu
show_menu() {
    echo
    echo -e "${BLUE}=== OrganizeMe Docker Manager ===${NC}"
    echo "1. Start services"
    echo "2. Stop services"
    echo "3. Stop and remove volumes"
    echo "4. View logs"
    echo "5. View service status"
    echo "6. Rebuild services"
    echo "7. Access PostgreSQL"
    echo "8. Run migrations"
    echo "9. Clean up everything"
    echo "0. Exit"
    echo
}

# Start services
start_services() {
    print_info "Building services..."
    docker-compose build
    
    print_info "Starting services..."
    docker-compose up -d
    
    print_success "Services started!"
    print_info "Waiting for services to be ready..."
    sleep 5
    
    print_info "Service Status:"
    docker-compose ps
    
    print_info "Frontend: http://localhost:$(grep FRONTEND_PORT .env | cut -d '=' -f 2)"
    print_info "Backend: http://localhost:$(grep PORT .env | cut -d '=' -f 2)"
}

# Stop services
stop_services() {
    print_info "Stopping services..."
    docker-compose stop
    print_success "Services stopped"
}

# Stop and remove
stop_and_remove() {
    print_warning "This will stop services and remove volumes. Continue? (yes/no)"
    read confirmation
    
    if [ "$confirmation" != "yes" ]; then
        print_info "Cancelled"
        return
    fi
    
    print_info "Stopping and removing services..."
    docker-compose down -v
    print_success "Services removed"
}

# View logs
view_logs() {
    echo "Which service? (backend/frontend/postgres/all)"
    read service
    
    case $service in
        backend|frontend|postgres)
            docker-compose logs -f "$service"
            ;;
        all)
            docker-compose logs -f
            ;;
        *)
            print_error "Invalid service"
            ;;
    esac
}

# View status
view_status() {
    print_info "Container Status:"
    docker-compose ps
    echo
    
    print_info "Network Configuration:"
    docker network inspect organizeme_organizeme_network 2>/dev/null | grep -A 20 "Containers" || print_warning "Network not found"
    echo
    
    print_info "Volume Status:"
    docker volume ls | grep organizeme || print_info "No volumes yet"
}

# Rebuild services
rebuild_services() {
    print_info "Rebuilding services without cache..."
    docker-compose build --no-cache
    
    print_info "Restarting services..."
    docker-compose up -d
    
    print_success "Services rebuilt and restarted"
}

# Access PostgreSQL
access_postgres() {
    print_info "Connecting to PostgreSQL..."
    DB_USER=$(grep DB_USER .env | cut -d '=' -f 2)
    DB_NAME=$(grep DB_NAME .env | cut -d '=' -f 2)
    docker-compose exec postgres psql -U "$DB_USER" -d "$DB_NAME"
}

# Run migrations
run_migrations() {
    print_info "Would you like to:"
    echo "1. Backup current database"
    echo "2. Reset database"
    echo "0. Cancel"
    read choice
    
    case $choice in
        1)
            print_info "Backing up database..."
            DB_USER=$(grep DB_USER .env | cut -d '=' -f 2)
            DB_NAME=$(grep DB_NAME .env | cut -d '=' -f 2)
            docker-compose exec postgres pg_dump -U "$DB_USER" "$DB_NAME" > "backup_$(date +%Y%m%d_%H%M%S).sql"
            print_success "Database backed up"
            ;;
        2)
            print_warning "This will reset the database. Continue? (yes/no)"
            read conf
            if [ "$conf" = "yes" ]; then
                print_info "Resetting database..."
                docker-compose down -v
                docker-compose up -d
                print_success "Database reset"
            fi
            ;;
        0)
            print_info "Cancelled"
            ;;
        *)
            print_error "Invalid option"
            ;;
    esac
}

# Cleanup
cleanup_everything() {
    print_warning "This will remove all containers, volumes, and networks. Continue? (yes/no)"
    read confirmation
    
    if [ "$confirmation" != "yes" ]; then
        print_info "Cancelled"
        return
    fi
    
    print_info "Removing all Docker resources..."
    docker-compose down -v --remove-orphans
    
    print_info "Removing dangling images..."
    docker image prune -f
    
    print_success "Cleanup completed"
}

# Main loop
main() {
    check_docker
    check_docker_daemon
    check_env_file
    
    while true; do
        show_menu
        read -p "Choose an option: " choice
        
        case $choice in
            1)
                start_services
                ;;
            2)
                stop_services
                ;;
            3)
                stop_and_remove
                ;;
            4)
                view_logs
                ;;
            5)
                view_status
                ;;
            6)
                rebuild_services
                ;;
            7)
                access_postgres
                ;;
            8)
                run_migrations
                ;;
            9)
                cleanup_everything
                ;;
            0)
                print_info "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid option"
                ;;
        esac
    done
}

# Run main function
main
