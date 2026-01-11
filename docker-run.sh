#!/bin/bash
# Quick Docker commands for AI Chat App

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

function print_menu() {
    echo -e "${BLUE}===== AI Chat App - Docker Commands =====${NC}"
    echo ""
    echo "1. Start all services (first time setup)"
    echo "2. Start services in background"
    echo "3. Stop all services"
    echo "4. View logs (all services)"
    echo "5. View logs (app only)"
    echo "6. View logs (ollama only)"
    echo "7. Download LLaMA model"
    echo "8. Enter app container shell"
    echo "9. Enter ollama container shell"
    echo "10. Check service status"
    echo "11. Rebuild app image"
    echo "12. Complete cleanup (removes all data)"
    echo "0. Exit"
    echo ""
}

function start_setup() {
    echo -e "${GREEN}Starting all services...${NC}"
    docker-compose up
}

function start_background() {
    echo -e "${GREEN}Starting services in background...${NC}"
    docker-compose up -d
    echo -e "${GREEN}Services started! Check logs with: docker-compose logs -f${NC}"
}

function stop_services() {
    echo -e "${GREEN}Stopping all services...${NC}"
    docker-compose down
    echo -e "${GREEN}Services stopped!${NC}"
}

function view_logs_all() {
    docker-compose logs -f
}

function view_logs_app() {
    docker-compose logs -f app
}

function view_logs_ollama() {
    docker-compose logs -f ollama
}

function download_model() {
    echo -e "${GREEN}Downloading LLaMA model (this may take 5-10 minutes)...${NC}"
    docker-compose exec ollama ollama pull llama3.1
    echo -e "${GREEN}Model downloaded!${NC}"
}

function enter_app_shell() {
    echo -e "${GREEN}Entering app container...${NC}"
    docker-compose exec app bash
}

function enter_ollama_shell() {
    echo -e "${GREEN}Entering ollama container...${NC}"
    docker-compose exec ollama bash
}

function check_status() {
    echo -e "${GREEN}Service Status:${NC}"
    docker-compose ps
    echo ""
    echo -e "${GREEN}Access URLs:${NC}"
    echo "Chat UI: http://localhost:8000/static/index.html"
    echo "API Docs: http://localhost:8000/docs"
    echo "Ollama: http://localhost:11434"
}

function rebuild_app() {
    echo -e "${GREEN}Rebuilding app image...${NC}"
    docker-compose build --no-cache app
    echo -e "${GREEN}Image rebuilt! Restart with: docker-compose up -d app${NC}"
}

function cleanup() {
    echo -e "${RED}WARNING: This will delete all containers, volumes, and data!${NC}"
    read -p "Are you sure? Type 'yes' to confirm: " confirm
    if [ "$confirm" = "yes" ]; then
        docker-compose down -v
        docker system prune -a --volumes -f
        echo -e "${GREEN}Cleanup complete!${NC}"
    else
        echo "Cleanup cancelled."
    fi
}

# Main loop
if [ $# -eq 0 ]; then
    while true; do
        print_menu
        read -p "Select an option (0-12): " choice
        echo ""
        
        case $choice in
            1) start_setup ;;
            2) start_background ;;
            3) stop_services ;;
            4) view_logs_all ;;
            5) view_logs_app ;;
            6) view_logs_ollama ;;
            7) download_model ;;
            8) enter_app_shell ;;
            9) enter_ollama_shell ;;
            10) check_status ;;
            11) rebuild_app ;;
            12) cleanup ;;
            0) echo "Exiting..."; exit 0 ;;
            *) echo -e "${RED}Invalid option${NC}" ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
        clear
    done
else
    # Command line mode
    case $1 in
        start) start_background ;;
        stop) stop_services ;;
        logs) view_logs_app ;;
        logs-all) view_logs_all ;;
        model) download_model ;;
        shell-app) enter_app_shell ;;
        shell-ollama) enter_ollama_shell ;;
        status) check_status ;;
        rebuild) rebuild_app ;;
        cleanup) cleanup ;;
        *) echo "Usage: $0 {start|stop|logs|logs-all|model|shell-app|shell-ollama|status|rebuild|cleanup}" ;;
    esac
fi
