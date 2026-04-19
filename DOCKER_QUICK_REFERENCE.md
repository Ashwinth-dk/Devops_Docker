# Docker Quick Reference Card

## 🚀 Start/Stop Services

```bash
# Start services (builds if needed)
docker-compose up -d

# Stop services
docker-compose down

# Stop and remove volumes (DESTRUCTIVE)
docker-compose down -v

# Restart all services
docker-compose restart

# Rebuild without cache
docker-compose build --no-cache
docker-compose up -d
```

## 📋 View Status & Logs

```bash
# Show running containers
docker-compose ps

# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100 backend

# Follow specific service
docker-compose logs -f backend --timestamps
```

## 🗄️ Database Commands

```bash
# Connect to PostgreSQL shell
docker-compose exec postgres psql -U admin -d organizeme

# Backup database
docker-compose exec postgres pg_dump -U admin organizeme > backup.sql

# Restore database
docker-compose exec -T postgres psql -U admin organizeme < backup.sql

# List databases
docker-compose exec postgres psql -U admin -l
```

## 🛠️ Debug & Access Containers

```bash
# Backend shell
docker-compose exec backend sh

# Frontend shell
docker-compose exec frontend sh

# Run command in backend
docker-compose exec backend npm list
docker-compose exec backend node -v

# Run command in frontend
docker-compose exec frontend npm list
docker-compose exec frontend node -v
```

## 📊 Monitoring

```bash
# Resource usage of all containers
docker stats

# Inspect container details
docker inspect <container_id>

# Network inspection
docker network inspect organizeme_organizeme_network

# Volume inspection
docker volume inspect organizeme_postgres_data
```

## 🔧 Maintenance

```bash
# Update base images
docker-compose pull

# Clean up dangling images
docker image prune -f

# Clean up all unused resources
docker system prune -a

# Remove specific volume
docker volume rm organizeme_postgres_data
```

## 👨‍💻 Development Workflow

```bash
# Watch logs while developing
docker-compose logs -f backend &
docker-compose logs -f frontend &

# Rebuild after dependency changes
docker-compose build backend
docker-compose up -d backend

# Hot reload already enabled via volumes
# Just edit files and save!
```

## 🚢 Production Commands

```bash
# Build production images
docker-compose -f docker-compose.yml build

# Start production environment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Stop production environment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

# View production logs
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

## 🎯 Make Commands

```bash
# Show all available commands
make help

# Start services
make up

# Stop services
make down

# View logs
make logs
make logs-backend
make logs-frontend
make logs-db

# Service status
make status
make ps

# Rebuild
make rebuild

# Database backup
make backup

# Connect to database
make shell-db

# Backend shell
make shell-backend

# Health check
make health

# Production
make prod-up
make prod-down
```

## 🔄 Common Workflows

### First Time Setup
```bash
cp .env.example .env
docker-compose build
docker-compose up -d
docker-compose ps
```

### Daily Development
```bash
docker-compose up -d
# Edit your files
docker-compose logs -f
# Changes auto-reload
docker-compose down
```

### After Code Changes
```bash
# Backend changes: auto-reloads with nodemon
# Frontend changes: auto-reloads with Vite HMR
# Database changes: need rebuild
docker-compose build
docker-compose restart
```

### Fix Issues
```bash
# View logs
docker-compose logs -f

# Access shell
docker-compose exec backend sh

# Restart service
docker-compose restart backend

# Full reset
docker-compose down -v
docker-compose up -d
```

### Backup & Restore
```bash
# Backup
docker-compose exec postgres pg_dump -U admin organizeme > backup_$(date +%Y%m%d).sql

# Restore
docker-compose exec -T postgres psql -U admin organizeme < backup.sql
```

## 🌐 Access URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:5000 |
| Database | postgres://localhost:5432 |
| API Test | http://localhost:5000/verify |

## ⚙️ Environment Variables

Key variables in `.env`:

```env
# Database
DB_USER=admin
DB_PASSWORD=securepassword
DB_NAME=organizeme
DB_HOST=postgres
DB_PORT=5432

# Backend
NODE_ENV=development
PORT=5000
JWT_SECRET=your_secret_key

# Frontend
VITE_API_URL=http://localhost:5000
FRONTEND_PORT=3000
```

## 🆘 Emergency Commands

```bash
# Kill all containers
docker kill $(docker ps -q)

# Remove all containers
docker rm $(docker ps -aq)

# Remove all images
docker rmi $(docker images -q)

# Start fresh (WARNING: DELETES DATA)
docker-compose down -v
rm -rf postgres_data
docker-compose up -d
```

## 📖 Documentation Links

- [QUICKSTART.md](QUICKSTART.md) - 3-minute quick start
- [DOCKER_SETUP.md](DOCKER_SETUP.md) - Detailed setup guide
- [DOCKER_TROUBLESHOOTING.md](DOCKER_TROUBLESHOOTING.md) - Common issues
- [CLOUD_DEPLOYMENT.md](CLOUD_DEPLOYMENT.md) - Cloud deployment

## 💡 Tips & Tricks

```bash
# Tail specific service with timestamps
docker-compose logs -f --timestamps backend

# Get all environment variables
docker-compose exec backend env

# Test service connectivity
docker-compose exec frontend ping backend
docker-compose exec backend ping postgres

# Copy from container
docker cp organizeme_backend:/app/file.txt ./local/path/

# Copy to container
docker cp ./local/file.txt organizeme_backend:/app/path/

# Check disk usage
du -sh postgres_data

# See network
docker network ls
docker network inspect organizeme_organizeme_network
```

---

**Save this for quick reference while working with Docker!**
