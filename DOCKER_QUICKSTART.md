# Docker Quick Start Guide

## 5-Minute Setup

### Step 1: Build and Start (First Time)

```bash
cd /Users/debrajbhattacharya/github/ai-app

# Start all services
docker-compose up -d

# Check if everything is running
docker-compose ps
```

### Step 2: Download LLaMA Model (First Time Only - ~5-10 mins)

```bash
# This downloads the 7B model (~3.5GB)
docker-compose exec ollama ollama pull llama3.1

# Or for a smaller model (faster)
docker-compose exec ollama ollama pull llama2
```

Check progress:

```bash
docker-compose logs -f ollama
```

### Step 3: Open the Chat

- **Chat UI**: http://localhost:8000/static/index.html
- **API Docs**: http://localhost:8000/docs

## Easy Commands

```bash
# Start in background
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Using the helper script (if chmod +x docker-run.sh)
./docker-run.sh start
./docker-run.sh logs
./docker-run.sh stop
```

## What's Running?

- **FastAPI App** on http://localhost:8000
- **Ollama** (Local LLM) on http://localhost:11434
- **PostgreSQL** on localhost:5432
- **Redis** on localhost:6379
- **Qdrant** on localhost:6333

## First Request Will Be Slow

The very first request after starting Ollama takes 30-60 seconds as it loads the model into memory. After that, responses are much faster (5-15 seconds depending on model size).

## Troubleshooting

**"Connection refused" to Ollama?**

```bash
docker-compose logs ollama
# Wait a bit longer for it to start
```

**"Port 8000 already in use"?**

```bash
# Change port in docker-compose.yaml or:
docker-compose down
```

**"No space left on device"?**

```bash
docker system prune -a --volumes
```

## For Full Documentation

See `DOCKER.md` for comprehensive guide with all commands and troubleshooting.

## Making Changes to Code

1. Edit files in `./app` or `./static`
2. Changes auto-reload (no need to restart)
3. Check logs: `docker-compose logs -f app`

## Stop Everything

```bash
docker-compose down
```

That's it! You now have a fully containerized AI chat app running locally.
