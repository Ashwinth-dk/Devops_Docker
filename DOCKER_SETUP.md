# Docker Setup Guide for OrganizeMe

This guide provides complete instructions for running the OrganizeMe full-stack application using Docker.

## Prerequisites

- Docker (latest version)
- Docker Compose (v1.29.0 or higher)
- Git

## Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd OrganizeMe
```

### 2. Environment Configuration

Copy the example environment file and update it with your settings:

```bash
cp .env.example .env
```

Edit `.env` with your desired configuration:

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
JWT_SECRET=your_jwt_secret_key_here_change_in_production
CLIENT_URL=http://localhost:5173

# Frontend
VITE_API_URL=http://localhost:5000
FRONTEND_PORT=3000
```

### 3. Build and Start Services

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: postgres://localhost:5432

## Available Commands

### Container Management

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# View running containers
docker-compose ps

# View logs
docker-compose logs -f [service-name]

# Execute command in container
docker-compose exec [service-name] [command]
```

### Database Operations

```bash
# Access PostgreSQL CLI
docker-compose exec postgres psql -U admin -d organizeme

# Backup database
docker-compose exec postgres pg_dump -U admin organizeme > backup.sql

# Restore database
docker-compose exec -T postgres psql -U admin organizeme < backup.sql
```

### Rebuild Services

```bash
# Rebuild specific service
docker-compose build [service-name]

# Rebuild without cache
docker-compose build --no-cache

# Rebuild and restart
docker-compose up -d --build
```

## Service Architecture

### Services Defined

1. **PostgreSQL Database** (`postgres`)
   - Port: 5432
   - Volume: postgres_data (persistent storage)
   - Healthcheck: Enabled

2. **Backend Server** (`backend`)
   - Port: 5000
   - Built from: `./Dockerfile`
   - Depends on: PostgreSQL
   - Node.js 18 Alpine

3. **Frontend Application** (`frontend`)
   - Port: 3000
   - Built from: `./Frontend/Dockerfile`
   - Depends on: Backend
   - Nginx Alpine

## Troubleshooting

### Issue: Connection refused on startup

**Solution**: Wait for database to be ready. Healthchecks ensure proper startup order.

```bash
docker-compose logs postgres
```

### Issue: Port already in use

**Solution**: Change ports in `.env` file:

```env
PORT=5001           # Backend
FRONTEND_PORT=3001  # Frontend
DB_PORT=5433        # Database
```

Then restart:

```bash
docker-compose down
docker-compose up -d
```

### Issue: Database setup failed

**Solution**: Ensure `database_schema.sql` exists and restart with clean volume:

```bash
docker-compose down -v
docker-compose up -d
```

### Issue: Cannot connect to API from frontend

**Solution**: Verify `VITE_API_URL` in `.env` matches your backend URL:

```env
VITE_API_URL=http://localhost:5000
```

For production, use your domain:

```env
VITE_API_URL=https://api.yourdomain.com
```

## Production Deployment

### Before Deploying

1. Update `.env` with production values:

```env
NODE_ENV=production
JWT_SECRET=generate_strong_random_string
DB_PASSWORD=generate_strong_random_string
SESSION_SECRET=generate_strong_random_string
```

2. Remove sensitive data from `docker-compose.yml` and use `.env` only.

3. Consider using Docker secrets for credentials:

```bash
docker secret create db_password ./secret.txt
```

4. Update nginx configuration for your domain in `Frontend/nginx.conf`.

### Deploy with Docker Stack (Swarm)

```bash
docker stack deploy -c docker-compose.yml organizeme
```

### Deploy with Kubernetes

Convert docker-compose.yml to Kubernetes manifests:

```bash
kompose convert -f docker-compose.yml
kubectl apply -f .
```

## Networking

All services communicate through the `organizeme_network` bridge network:

- **Backend → Database**: Uses hostname `postgres`
- **Frontend → Backend**: Uses hostname `backend`
- **External → Services**: Routes through exposed ports

## Volume Management

The application uses one named volume:

```
postgres_data: /var/lib/postgresql/data
```

### View volumes

```bash
docker volume ls
docker volume inspect organizeme_postgres_data
```

### Clean volumes

```bash
docker-compose down -v
```

## Performance Tuning

### Database Optimization

In `docker-compose.yml`:

```yaml
postgres:
  command: 
    - "postgres"
    - "-c"
    - "shared_buffers=256MB"
    - "-c"
    - "max_connections=200"
```

### Memory Limits

Add resource constraints:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
```

## Monitoring

### Health Status

```bash
docker-compose ps
```

### View Container Logs

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend

# Follow logs
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Container Stats

```bash
docker stats
```

## Development Workflow

### Hot Reload Frontend

The Frontend volume is mounted for live reloading:

```bash
# Changes in Frontend/src are automatically reloaded
```

### Backend Development

```bash
# Backend watches for changes (nodemon)
docker-compose logs -f backend
```

### Database Changes

For schema changes, update `database_schema.sql` and reinitialize:

```bash
docker-compose down -v
docker-compose up -d
```

## Security Best Practices

1. **Change Default Passwords**: Update in `.env`
2. **Use Strong JWT Secret**: Generate with `openssl rand -hex 32`
3. **Enable CORS Properly**: Set `CLIENT_URL` to your domain
4. **Use HTTPS**: Configure in reverse proxy (nginx/traefik)
5. **Keep Images Updated**: Regular `docker pull` and rebuild
6. **Scan for Vulnerabilities**: `docker scan`

## Backup and Restore

### Backup Database

```bash
docker-compose exec postgres pg_dump -U admin organizeme > backup_$(date +%Y%m%d).sql
```

### Restore Database

```bash
docker-compose exec -T postgres psql -U admin organizeme < backup.sql
```

### Backup Volumes

```bash
docker run --rm -v postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup.tar.gz /data
```

## Further Documentation

For additional information, see:
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Express.js Docker Guide](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [React Production Build](https://create-react-app.dev/docs/deployment/)
