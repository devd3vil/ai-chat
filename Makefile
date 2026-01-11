.PHONY: help docker-build docker-up docker-down docker-logs docker-shell-app docker-shell-ollama docker-model docker-clean docker-status

help:
	@echo "Docker Commands for AI Chat App"
	@echo "==============================="
	@echo ""
	@echo "Setup & Running:"
	@echo "  make docker-up          Start all services in background"
	@echo "  make docker-down        Stop all services"
	@echo "  make docker-build       Build app image"
	@echo "  make docker-rebuild     Rebuild app image without cache"
	@echo ""
	@echo "Monitoring:"
	@echo "  make docker-logs        View app logs (follow)"
	@echo "  make docker-logs-all    View all logs (follow)"
	@echo "  make docker-status      Show service status & URLs"
	@echo ""
	@echo "Development:"
	@echo "  make docker-shell-app   Enter app container bash shell"
	@echo "  make docker-shell-ollama Enter ollama container bash shell"
	@echo "  make docker-model       Download LLaMA model (first time setup)"
	@echo ""
	@echo "Maintenance:"
	@echo "  make docker-clean       Remove all stopped containers and unused images"
	@echo "  make docker-clean-all   Full cleanup (removes volumes too)"
	@echo ""

docker-up:
	@echo "Starting services..."
	docker-compose up -d
	@echo "✓ Services started!"
	@echo "Chat UI: http://localhost:8000/static/index.html"
	@echo "API Docs: http://localhost:8000/docs"
	@echo "Run 'make docker-logs' to view logs"

docker-down:
	@echo "Stopping services..."
	docker-compose down
	@echo "✓ Services stopped!"

docker-build:
	@echo "Building app image..."
	docker-compose build app

docker-rebuild:
	@echo "Rebuilding app image (no cache)..."
	docker-compose build --no-cache app

docker-logs:
	docker-compose logs -f app

docker-logs-all:
	docker-compose logs -f

docker-logs-ollama:
	docker-compose logs -f ollama

docker-shell-app:
	@echo "Entering app container..."
	docker-compose exec app bash

docker-shell-ollama:
	@echo "Entering ollama container..."
	docker-compose exec ollama bash

docker-model:
	@echo "Downloading LLaMA3.1 model (5-10 minutes)..."
	docker-compose exec ollama ollama pull llama3.1
	@echo "✓ Model downloaded!"

docker-status:
	@echo "Service Status:"
	docker-compose ps
	@echo ""
	@echo "Access URLs:"
	@echo "  Chat UI: http://localhost:8000/static/index.html"
	@echo "  API Docs: http://localhost:8000/docs"
	@echo "  Ollama: http://localhost:11434"

docker-clean:
	@echo "Cleaning up stopped containers and unused images..."
	docker system prune -f
	@echo "✓ Cleanup complete!"

docker-clean-all:
	@echo "WARNING: This will remove all Docker data!"
	@echo "Removing containers, images, and volumes..."
	docker-compose down -v
	docker system prune -a --volumes -f
	@echo "✓ Complete cleanup done!"

docker-ps:
	docker-compose ps -a

# Quick setup for first time
docker-setup: docker-build docker-up docker-model
	@echo ""
	@echo "✓ Setup complete! Chat available at http://localhost:8000/static/index.html"

# Development - restart app only
docker-restart-app:
	docker-compose restart app

# Development - rebuild and restart app
docker-restart-app-full:
	docker-compose build app
	docker-compose restart app

# Testing
docker-test:
	@echo "Running tests in Docker..."
	docker-compose exec app python -m pytest tests/ -v

# Database commands
docker-db-shell:
	docker-compose exec postgres psql -U postgres -d app

docker-redis-shell:
	docker-compose exec redis redis-cli

# Useful for debugging
docker-env:
	@echo "Environment variables in app container:"
	docker-compose exec app env | sort

# Check if Ollama is accessible
docker-ollama-check:
	@echo "Checking Ollama connectivity..."
	@docker-compose exec app curl -s http://ollama:11434/api/tags | python -m json.tool
