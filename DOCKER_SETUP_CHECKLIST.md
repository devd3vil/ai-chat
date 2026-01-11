# Docker Setup Checklist ✓

## Pre-Flight Check

- [ ] Docker Desktop installed (https://www.docker.com/products/docker-desktop)
- [ ] Docker Compose available (`docker-compose --version`)
- [ ] At least 8GB RAM available
- [ ] At least 20GB disk space available
- [ ] Project cloned/downloaded to your machine
- [ ] Terminal open in project root directory

## Quick Start (5 Steps)

### Step 1: Understand What You're Getting

- [ ] Read: DOCKER_QUICKSTART.md (takes 2 minutes)
- [ ] Understand: 3 containers (FastAPI, Ollama, databases)
- [ ] Know: First response will be slow (model loading)

### Step 2: Start Containers

```bash
docker-compose up -d
```

- [ ] Command executed
- [ ] No errors in output
- [ ] All services should start

### Step 3: Verify Services Running

```bash
docker-compose ps
```

- [ ] See "ai-app" container - RUNNING
- [ ] See "ollama" container - RUNNING
- [ ] All services showing "Up"

### Step 4: Download AI Model (First Time Only)

```bash
docker-compose exec ollama ollama pull llama3.1
```

- [ ] Command started downloading
- [ ] Watch progress (5-10 minutes)
- [ ] Completes successfully

### Step 5: Open Chat UI

```bash
# Option A: Manual
open http://localhost:8000/static/index.html

# Option B: API Docs (to test endpoints)
open http://localhost:8000/docs
```

- [ ] Browser opens to chat interface
- [ ] Page loads (wait 2-3 seconds)
- [ ] Chat UI visible with welcome message

## Testing the Setup

### Test 1: Chat UI Loads

- [ ] Visit http://localhost:8000/static/index.html
- [ ] See chat interface
- [ ] Input field visible
- [ ] Can type a message

### Test 2: First Request Works

- [ ] Type: "What is Docker?"
- [ ] Click Send
- [ ] **Wait 30-60 seconds** (first time is slow)
- [ ] See AI response appearing
- [ ] Response streams in real-time

### Test 3: Second Request is Faster

- [ ] Type: "Explain it simply"
- [ ] Click Send
- [ ] Should respond in 5-15 seconds (faster!)
- [ ] Confirm it's working

### Test 4: API Docs Work

- [ ] Visit http://localhost:8000/docs
- [ ] See Swagger UI
- [ ] Can expand endpoints
- [ ] Try "POST /ask_stream" endpoint

## Development Checklist

### Making Code Changes

- [ ] Edit file in `./app` or `./static`
- [ ] Save file
- [ ] Refresh browser or check logs
- [ ] Confirm changes applied (no restart needed!)

### Viewing Logs

- [ ] `docker-compose logs -f app` - shows app logs
- [ ] `docker-compose logs -f ollama` - shows LLM logs
- [ ] Ctrl+C to stop viewing logs

### Debugging Issues

- [ ] `docker-compose logs` - full history
- [ ] `docker-compose ps` - see which containers running
- [ ] `docker-compose exec app bash` - access container
- [ ] Inside container: `curl http://ollama:11434/api/tags` - check Ollama

## Command Reference

### Start/Stop

```bash
docker-compose up -d        # Start all services
docker-compose down         # Stop all services
docker-compose restart      # Restart everything
```

### Monitoring

```bash
docker-compose ps           # See running containers
docker-compose logs -f      # Stream all logs
docker-compose logs -f app  # Stream app logs only
```

### Management

```bash
docker-compose exec app bash                    # Shell into app
docker-compose exec ollama ollama list          # See available models
docker-compose exec ollama ollama pull llama2   # Get different model
```

### Cleanup

```bash
docker-compose down         # Stop services
docker system prune         # Remove unused images
docker system df            # Check disk usage
```

## Using Make Commands (Easier)

```bash
make help              # Show all commands
make docker-up         # Start services
make docker-logs       # View app logs
make docker-model      # Download model
make docker-shell-app  # Enter container
make docker-down       # Stop services
```

## If Something Goes Wrong

### Symptom: Services won't start

```bash
docker-compose logs
# Check error message, fix issue, try again
docker-compose up -d
```

### Symptom: Port already in use

```bash
# Either stop the other service or change port in docker-compose.yaml
# Port 8000 is in use? Change to "8001:8000"
docker-compose up -d
```

### Symptom: Ollama connection refused

```bash
docker-compose logs ollama
# Wait a bit longer for it to start
docker-compose ps  # Check if it's running
```

### Symptom: Out of disk space

```bash
docker system prune -a --volumes
# This removes ALL unused Docker data
# Then try again
```

### Symptom: First response taking forever

```bash
# This is NORMAL! Model loading for first time = slow
# Wait 30-60 seconds
# Subsequent requests will be much faster
```

### Hard Reset

```bash
docker-compose down -v    # Stop and remove all volumes
rm -rf ~/.ollama          # Delete local ollama cache (optional)
docker-compose up -d      # Fresh start
docker-compose exec ollama ollama pull llama3.1  # Redownload model
```

## Optional: Using Alternative Models

### Smaller/Faster Model

```bash
# Instead of llama3.1, try llama2 (smaller, faster)
docker-compose exec ollama ollama pull llama2
```

### Check Available Models

```bash
docker-compose exec ollama ollama list
```

### Remove Model

```bash
docker-compose exec ollama ollama rm llama3.1
```

## Optimization Tips

### Speed Up Development

- Use the same terminal for logs: `docker-compose logs -f`
- Make changes, save, refresh browser (hot-reload!)
- No need to restart containers

### Free Up Resources

```bash
# Stop services when not using
docker-compose down

# But keep volumes (model data)
# Use -v flag to also delete volumes
```

### Monitor Performance

```bash
docker stats           # Real-time CPU/memory
docker system df       # Disk usage breakdown
```

## Success Criteria ✓

Your setup is successful when:

- [ ] `docker-compose ps` shows all services as "Up"
- [ ] Browser opens chat UI at http://localhost:8000/static/index.html
- [ ] Can send a message and get AI response
- [ ] First response works (slow is ok!)
- [ ] Second response is faster
- [ ] Code changes apply without restart
- [ ] Logs visible via `docker-compose logs`

## Documentation Navigation

- **Quick answers**: DOCKER_QUICKSTART.md
- **Complete reference**: DOCKER.md
- **Troubleshooting**: DOCKER.md (section: Troubleshooting)
- **Visual guide**: DOCKER_VISUAL_GUIDE.md
- **What was created**: DOCKER_IMPLEMENTATION.md
- **This checklist**: DOCKER_SETUP_CHECKLIST.md

## Next Steps After Setup

1. ✅ Confirm everything working
2. ✅ Explore API Docs at http://localhost:8000/docs
3. ✅ Try different prompts in chat
4. ✅ Make code changes and test hot-reload
5. ✅ Read DOCKER.md for advanced usage
6. ✅ Set up production deployment (when ready)

---

## Support & Help

### Quick Fixes

1. Check logs: `docker-compose logs -f`
2. Restart container: `docker-compose restart app`
3. Full restart: `docker-compose down && docker-compose up -d`

### Getting Help

- See **DOCKER.md** - extensive troubleshooting section
- Check **DOCKER_VISUAL_GUIDE.md** - decision trees and common scenarios
- Review **Docker logs** - most issues visible there

### Still Stuck?

```bash
# Gather debug info
docker-compose ps
docker-compose logs
docker system df

# Then check DOCKER.md or relevant documentation
```

---

**You're all set! Click below to continue:** 🎉

1. Open http://localhost:8000/static/index.html
2. Type a question
3. Wait for the magic ✨

**Total time to working setup: ~15 minutes** ⏱️

Good luck! 🚀
