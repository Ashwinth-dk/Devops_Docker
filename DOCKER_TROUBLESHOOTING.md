# Docker Troubleshooting & FAQ

## Common Issues and Solutions

### Services Won't Start

**Problem**: Containers exit immediately or won't stay running

**Solutions**:
```bash
# Check logs
docker-compose logs [service-name]

# Check if ports are in use
lsof -i :5000  # Backend
lsof -i :3000  # Frontend
lsof -i :5432  # Database

# Free the port or use different one
docker-compose down
# Edit .env and change PORT, FRONTEND_PORT, or DB_PORT
```

### Database Connection Failed

**Problem**: Backend can't connect to PostgreSQL

**Solutions**:
```bash
# Wait for database to be ready
docker-compose logs postgres

# Check if postgres is healthy
docker-compose exec postgres pg_isready

# Verify environment variables
docker-compose config | grep DB_

# Restart database
docker-compose restart postgres
```

### "Connection Refused" on First Startup

**Problem**: Service tries connecting before dependencies are ready

**Solution**: This is normal! Docker Compose uses healthchecks:
```bash
# Wait 10-15 seconds and check status
sleep 15
docker-compose ps

# View logs to confirm startup
docker-compose logs
```

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::5000`

**Solutions**:
```bash
# Find what's using the port
lsof -i :5000

# Stop the conflicting service
kill -9 <PID>

# Or use different ports in .env:
echo "PORT=5001" >> .env
echo "FRONTEND_PORT=3001" >> .env
echo "DB_PORT=5433" >> .env

# Restart
docker-compose down && docker-compose up -d
```

### High Memory Usage

**Problem**: Docker containers using too much RAM

**Solutions**:
1. Check resource limits in docker-compose.yml
2. Restart containers with smaller limits
3. Check for memory leaks in code

```bash
# Check resource usage
docker stats

# Limit memory for a service
docker update --memory=512m container_name
```

### Database Data Lost After Restart

**Problem**: Data disappears when stopping/starting containers

**Solution**: Ensure postgres_data volume persists:
```bash
# Check volume exists
docker volume ls | grep organizeme

# Check volume path
docker volume inspect organizeme_postgres_data

# Backup before operations
docker-compose exec postgres pg_dump -U admin organizeme > backup.sql
```

### Can't Access Services from Host

**Problem**: Can't reach http://localhost:3000 or http://localhost:5000

**Solutions**:
```bash
# Check if services are running
docker-compose ps

# Check port mapping
docker-compose port frontend
docker-compose port backend

# Try accessing from within container
docker-compose exec frontend curl http://backend:5000
```

### Network Issues Between Services

**Problem**: Services can't reach each other (e.g., frontend can't reach backend)

**Solutions**:
```bash
# Verify network exists
docker network ls | grep organizeme

# Check if services are connected
docker network inspect organizeme_organizeme_network

# Test connectivity
docker-compose exec frontend curl http://backend:5000

# Restart networking
docker-compose down
docker-compose up -d
```

### Build Fails with "No Space Left"

**Problem**: Docker build fails due to disk space

**Solutions**:
```bash
# Check disk space
df -h

# Clean up Docker
docker system prune -a

# Remove all unused volumes
docker volume prune

# Remove dangling images
docker image prune -a
```

### Dockerfile Build Issues

**Problem**: Build fails with permission or dependency errors

**Solutions**:
```bash
# Build with verbose output
docker-compose build --verbose [service-name]

# Force rebuild without cache
docker-compose build --no-cache [service-name]

# Check Dockerfile syntax
docker build -f Dockerfile .

# View build logs
docker build --progress=plain -t test-image .
```

### Certificate/SSL Issues

**Problem**: HTTPS or certificate validation errors

**Solutions**:
```bash
# For development, disable SSL verification
export NODE_TLS_REJECT_UNAUTHORIZED=0

# Or in .env
NODE_TLS_REJECT_UNAUTHORIZED=0

# For production, properly configure certificates
```

### Environment Variables Not Loading

**Problem**: .env variables not being read

**Solutions**:
```bash
# Verify .env exists
cat .env

# Rebuild to pick up new env vars
docker-compose build --no-cache

# Stop and start (not restart)
docker-compose down
docker-compose up -d

# Check what's being used
docker-compose config
```

### Frontend Shows Blank Page or 404

**Problem**: Frontend loads but can't find routes or resources

**Solutions**:
```bash
# Check nginx configuration
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf

# Check if build was successful
docker-compose logs frontend

# Verify API connection
docker-compose exec frontend curl http://backend:5000

# Check JavaScript console in browser for errors
# Press F12 in browser and check Console tab
```

### Backend Returns 404 for API Routes

**Problem**: API endpoints return 404 Not Found

**Solutions**:
```bash
# Check if backend is running
docker-compose exec backend ps aux

# Check route configuration
docker-compose exec backend curl http://localhost:5000/verify

# View logs for errors
docker-compose logs backend

# Verify routes are loaded
curl -i http://localhost:5000/auth/login
```

### CORS Errors in Browser

**Problem**: "Access to XMLHttpRequest blocked by CORS policy"

**Solutions**:
```bash
# Check CORS configuration in Server/index.js
docker-compose logs backend | grep -i cors

# Verify CLIENT_URL in .env
grep CLIENT_URL .env
grep VITE_API_URL .env

# These should match:
# Frontend running on: http://localhost:3000
# Backend API URL: http://localhost:5000

# Update .env if needed
sed -i 's/CLIENT_URL=.*/CLIENT_URL=http:\/\/localhost:3000/' .env
sed -i 's/VITE_API_URL=.*/VITE_API_URL=http:\/\/localhost:5000/' .env

docker-compose down && docker-compose up -d
```

## Debugging Techniques

### Access Container Shell

```bash
# Backend Node shell
docker-compose exec backend sh

# Frontend shell
docker-compose exec frontend sh

# Database CLI
docker-compose exec postgres psql -U admin -d organizeme
```

### Real-time Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend

# With timestamps
docker-compose logs -f --timestamps backend
```

### Inspect Container

```bash
# Get container ID
docker ps | grep organizeme

# Inspect container details
docker inspect <container_id>

# Check resource usage
docker stats <container_id>

# Get IP address
docker inspect <container_id> | grep IPAddress
```

### Execute Commands in Container

```bash
# Run one-off command
docker-compose exec backend npm list

# Run with stdin for interactive
docker-compose exec -it backend bash

# Run without starting stdin
docker-compose exec -T backend ls -la
```

## Performance Tuning

### Database Performance

```bash
# Connect to database
docker-compose exec postgres psql -U admin -d organizeme

# Check slow queries
SELECT * FROM pg_stat_statements;

# Analyze query plans
EXPLAIN ANALYZE SELECT * FROM employee;
```

### Monitor Resources

```bash
# Real-time stats
docker stats

# Top processes
docker top <container_id>

# Memory usage details
docker inspect <container_id> | grep Memory
```

### Optimize Images

```bash
# Check image size
docker images | grep organizeme

# Build with BuildKit for smaller images
DOCKER_BUILDKIT=1 docker build -t image-name .
```

## Useful Commands

```bash
# List all containers (including stopped)
docker ps -a

# Show container resource usage
docker stats --no-stream

# Copy files from container
docker cp container_id:/app/file.txt ./local-path/

# Copy files to container
docker cp ./local-path/file.txt container_id:/app/

# Restart all services
docker-compose restart

# Pull latest base images
docker-compose pull

# View environment variables in container
docker-compose exec backend env

# Check network connectivity
docker-compose exec backend ping postgres
```

## Getting Help

1. Check logs: `docker-compose logs -f [service]`
2. Verify configuration: `docker-compose config`
3. Test connectivity: `docker-compose exec service_name ping other_service`
4. Check official documentation:
   - [Docker Compose Docs](https://docs.docker.com/compose/)
   - [Docker Docs](https://docs.docker.com/)
   - [Node.js Docker Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

## Emergency Recovery

### Reset Everything

```bash
# DESTRUCTIVE - Removes all containers and volumes
docker-compose down -v
docker system prune -a

# Fresh start
docker-compose build
docker-compose up -d
```

### Backup Before Major Changes

```bash
# Backup database
docker-compose exec postgres pg_dump -U admin organizeme > backup_$(date +%Y%m%d).sql

# Backup volumes
docker run --rm -v organizeme_postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/volume_backup.tar.gz /data
```

### Restore from Backup

```bash
# Restore database
docker-compose exec -T postgres psql -U admin organizeme < backup_DATE.sql

# Restore volumes
docker run --rm -v organizeme_postgres_data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/volume_backup.tar.gz -C /
```
