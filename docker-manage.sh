#!/bin/bash
# Docker Setup and Deployment Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    exit 1
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check prerequisites
check_requirements() {
    print_header "Checking Requirements"
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker from https://docker.com"
    fi
    print_success "Docker is installed"
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install it."
    fi
    print_success "Docker Compose is installed"
    
    # Check if .env file exists
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from .env.example..."
        cp .env.example .env
        print_info "Please update .env with your configuration before deploying to production"
    else
        print_success ".env file found"
    fi
}

# Build images
build_images() {
    print_header "Building Docker Images"
    docker-compose build $@
    print_success "Docker images built successfully"
}

# Start services
start_services() {
    print_header "Starting Services"
    docker-compose up -d
    print_success "Services started"
    
    # Wait for database to be ready
    print_info "Waiting for database to be ready..."
    sleep 10
    
    # Run migrations
    print_info "Running database migrations..."
    docker-compose exec -T backend pnpm exec prisma migrate deploy 2>/dev/null || true
    
    print_success "All services are running!"
}

# Stop services
stop_services() {
    print_header "Stopping Services"
    docker-compose down
    print_success "Services stopped"
}

# Show status
show_status() {
    print_header "Service Status"
    docker-compose ps
}

# Show logs
show_logs() {
    print_header "Service Logs"
    docker-compose logs -f $@
}

# Clean up
cleanup() {
    print_header "Cleaning Up"
    print_warning "This will remove all containers, volumes, and images!"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down -v
        print_success "Cleanup complete"
    else
        print_info "Cleanup cancelled"
    fi
}

# Print URLs
print_urls() {
    echo ""
    print_header "Application URLs"
    echo -e "${GREEN}Frontend:${NC} http://localhost:3000"
    echo -e "${GREEN}Backend API:${NC} http://localhost:3001"
    echo -e "${GREEN}Database:${NC} localhost:3306"
    echo ""
    echo -e "${BLUE}Database credentials:${NC}"
    echo "  User: $(grep DB_USER .env | cut -d '=' -f2)"
    echo "  Database: $(grep DB_NAME .env | cut -d '=' -f2)"
    echo ""
}

# Main menu
show_menu() {
    echo ""
    print_header "Barbershop Docker Management"
    echo "1) Check requirements"
    echo "2) Build images"
    echo "3) Start services"
    echo "4) Stop services"
    echo "5) Show status"
    echo "6) Show logs"
    echo "7) Cleanup"
    echo "8) Full restart (stop + build + start)"
    echo "0) Exit"
    echo ""
}

# Main execution
if [ $# -eq 0 ]; then
    # Interactive mode
    while true; do
        show_menu
        read -p "Choose an option: " choice
        
        case $choice in
            1) check_requirements ;;
            2) build_images ;;
            3) start_services ;;
            4) stop_services ;;
            5) show_status ;;
            6) show_logs ;;
            7) cleanup ;;
            8) stop_services && build_images && start_services ;;
            0) echo "Exiting..."; exit 0 ;;
            *) print_error "Invalid option" ;;
        esac
    done
else
    # Command line mode
    case "$1" in
        check) check_requirements ;;
        build) shift; build_images $@ ;;
        start) start_services ;;
        stop) stop_services ;;
        status) show_status ;;
        logs) shift; show_logs $@ ;;
        clean) cleanup ;;
        restart) stop_services && build_images && start_services ;;
        urls) print_urls ;;
        *) 
            echo "Usage: $0 {check|build|start|stop|status|logs|clean|restart|urls}"
            exit 1
            ;;
    esac
fi

print_urls
