# Docker Setup Guide for AI Chat App

This guide explains how to run the AI Chat application in Docker containers locally.

## Prerequisites

- **Docker** installed ([download](https://www.docker.com/products/docker-desktop))
- **Docker Compose** installed (comes with Docker Desktop)
- At least **8GB RAM** recommended (for Ollama)
- 20GB+ disk space (for LLaMA model)

## Quick Start

### 1. Start All Services

```bash
# From the project root directory
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### 2. First Time Setup - Download LLaMA Model

After starting Ollama, download the LLaMA model (one-time setup):

```bash
# Get into the ollama container
docker-compose exec ollama ollama pull llama3.1

# Or for a smaller model
docker-compose exec ollama ollama pull llama2
```

This will take several minutes depending on your internet speed (3-5GB download for llama3.1).

### 3. Access the Application

- **Chat UI**: http://localhost:8000/static/index.html
- **API Docs**: http://localhost:8000/docs
- **Ollama API**: http://localhost:11434

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Local Docker Network                          │
│                      (ai-network)                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │   FastAPI App    │         │   Ollama         │             │
│  │   (Port 8000)    │────────>│  (Port 11434)    │             │
│  │                  │         │  (LLaMA Models)  │             │
│  └──────────────────┘         └──────────────────┘             │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │  PostgreSQL      │  │   Redis      │  │  Qdrant (Vector) │ │
│  │  (Port 5432)     │  │  (Port 6379) │  │  (Port 6333)     │ │
│  └──────────────────┘  └──────────────┘  └──────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Service Details

### FastAPI App Container

- **Image**: Built from local `Dockerfile`
- **Port**: 8000 (Host) → 8000 (Container)
- **Features**:
  - Hot-reload enabled (code changes reflect immediately)
  - Volume mounts for live development
  - Connects to Ollama for LLM inference
  - Health check every 30 seconds

### Ollama Container

- **Image**: `ollama/ollama:latest`
- **Port**: 11434 (Host) → 11434 (Container)
- **Storage**: Persistent volume `ollama-data` (/root/.ollama)
- **Models**: Downloaded and stored in the volume
- **Note**: First request may be slow as models are loaded from disk

### Optional Services

- **PostgreSQL**: Database (Port 5432)
- **Redis**: Cache/Queue (Port 6379)
- **Qdrant**: Vector database (Port 6333)

## Common Commands

### View Logs

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs app
docker-compose logs ollama

# Follow logs in real-time
docker-compose logs -f app

# Last 100 lines
docker-compose logs --tail=100
```

### Execute Commands in Container

```bash
# Interactive shell in app container
docker-compose exec app bash

# Interactive shell in ollama container
docker-compose exec ollama bash

# Run Python commands
docker-compose exec app python -c "import fastapi; print(fastapi.__version__)"
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart app
docker-compose restart ollama
```

### View Container Status

```bash
# List running containers
docker-compose ps

# Detailed container info
docker-compose ps -a
```

### Clean Up

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# Remove unused images
docker image prune

# Complete cleanup
docker system prune -a
```

## Development Workflow

### Making Code Changes

1. Edit files in `./app` or `./static` directories
2. Changes are automatically reflected in the running container (hot-reload enabled)
3. Check logs for any errors: `docker-compose logs -f app`

### Adding New Dependencies

1. Update `pyproject.toml` with new dependencies
2. Rebuild the image:
   ```bash
   docker-compose build app
   docker-compose up -d app
   ```

### Debugging

```bash
# Enter app container
docker-compose exec app bash

# Run Python directly
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# Check if Ollama is accessible
curl http://ollama:11434/api/tags

# View app logs with timestamps
docker-compose logs --timestamps -f app
```

## Environment Variables

Create a `.env` file in the project root (already exists):

```bash
OPENAI_API_KEY=your-key-here  # Optional, for future OpenAI integration
```

The container reads from `.env` on startup.

## Troubleshooting

### Issue: Port Already in Use

```bash
# Find and kill process on port 8000
lsof -i :8000
kill -9 <PID>

# Or change port in docker-compose.yaml
# Change "8000:8000" to "8001:8000"
```

### Issue: Ollama Connection Refused

```bash
# Check if ollama container is running
docker-compose ps

# Check ollama logs
docker-compose logs ollama

# Ensure ollama is healthy
docker-compose exec ollama ollama list
```

### Issue: Docker Compose Build Fails

```bash
# Rebuild without cache
docker-compose build --no-cache app

# Check Docker daemon is running
docker ps
```

### Issue: Out of Disk Space

```bash
# Check current usage
docker system df

# Clean up unused images/volumes
docker system prune -a --volumes
```

### Issue: Very Slow First Request to Ollama

The first request loads the model into memory from disk. Subsequent requests are faster.

## Production Considerations

For production deployment:

1. **Remove volume mounts** from `docker-compose.yaml` (only for development)
2. **Set `--reload` to false** in production command
3. **Add authentication** to FastAPI endpoints
4. **Use environment-specific configs** (.env.prod, docker-compose.prod.yaml)
5. **Set appropriate resource limits** in docker-compose.yaml:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: "2"
         memory: 4G
       reservations:
         cpus: "1"
         memory: 2G
   ```
6. **Use a reverse proxy** (nginx) for HTTPS
7. **Monitor container health** with proper logging

## Performance Tuning

### Ollama Performance

```yaml
environment:
  - OLLAMA_NUM_GPU=1 # Enable GPU if available
  - OLLAMA_NUM_THREAD=8 # Adjust based on CPU cores
```

### FastAPI Performance

```yaml
command: python -m uvicorn app.main:app
  --host 0.0.0.0
  --port 8000
  --workers 4 # Multiple worker processes
```

## Next Steps

1. Start services: `docker-compose up -d`
2. Download model: `docker-compose exec ollama ollama pull llama3.1`
3. Open browser: http://localhost:8000/static/index.html
4. Start chatting!

## Resources

- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Ollama Documentation](https://github.com/ollama/ollama)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
