# Cloud Deployment Guide

Guide for deploying OrganizeMe Docker containers to various cloud platforms.

## Table of Contents

1. [Docker Hub / Container Registry](#docker-hub--container-registry)
2. [AWS](#aws)
3. [Google Cloud Platform](#google-cloud-platform)
4. [Azure](#azure)
5. [Render](#render)
6. [Railway](#railway)
7. [DigitalOcean](#digitalocean)
8. [Heroku](#heroku)

---

## Docker Hub / Container Registry

### Push Images to Docker Hub

```bash
# Login to Docker Hub
docker login

# Tag images
docker tag organizeme-backend:latest yourusername/organizeme-backend:latest
docker tag organizeme-frontend:latest yourusername/organizeme-frontend:latest
docker tag organizeme-db:latest yourusername/organizeme-db:postgres:16-alpine

# Push to Docker Hub
docker push yourusername/organizeme-backend:latest
docker push yourusername/organizeme-frontend:latest
docker push yourusername/organizeme-db:latest

# Or use GitHub Container Registry
docker tag organizeme-backend:latest ghcr.io/yourusername/organizeme-backend:latest
docker push ghcr.io/yourusername/organizeme-backend:latest
```

---

## AWS

### Option 1: ECS with Docker Compose

```bash
# Install AWS CLI and configure credentials
aws configure

# Create ECS context
docker context create ecs myecscontext

# Use ECS context
docker context use myecscontext

# Deploy
docker-compose up -d
```

### Option 2: ECS with CloudFormation

```yaml
# Create docker-compose template for ECS
version: '3.8'
services:
  backend:
    image: your-registry/organizeme-backend:latest
    environment:
      - DB_HOST=database.ci12345.us-east-1.rds.amazonaws.com
      - NODE_ENV=production
  frontend:
    image: your-registry/organizeme-frontend:latest
  postgres:
    # Use AWS RDS instead of containers
    skip: true
```

### Option 3: EC2 with Docker

```bash
# SSH into EC2 instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Install Docker and Docker Compose
sudo yum update -y
sudo yum install -y docker docker-compose
sudo systemctl start docker
sudo usermod -a -G docker ec2-user

# Clone repository
git clone your-repo.git
cd OrganizeMe

# Create .env
cp .env.example .env
# Edit .env with production values

# Start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Option 4: Elastic Container Service Steps

1. Create ECR repositories for backend and frontend
2. Push images to ECR
3. Create ECS task definitions
4. Create ECS cluster
5. Create ECS services
6. Configure load balancer
7. Set up CloudWatch logs

```bash
# Create ECR repo
aws ecr create-repository --repository-name organizeme-backend

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

# Tag and push
docker tag organizeme-backend:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/organizeme-backend:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/organizeme-backend:latest
```

---

## Google Cloud Platform

### Cloud Run Deployment

```bash
# Install Google Cloud SDK
curl https://sdk.cloud.google.com | bash

# Initialize and authenticate
gcloud init
gcloud auth login

# Set project
gcloud config set project PROJECT_ID

# Build and push to Artifact Registry
gcloud builds submit --config cloudbuild.yaml

# Deploy to Cloud Run
gcloud run deploy organizeme-backend \
  --image gcr.io/PROJECT_ID/organizeme-backend \
  --platform managed \
  --region us-central1 \
  --set-env-vars "DB_HOST=cloudsql-instance-ip,DB_USER=admin,DB_PASSWORD=${DB_PASSWORD}"
```

### Cloud Run with Cloud SQL Proxy

```bash
# Create Cloud SQL Postgres instance
gcloud sql instances create organizeme-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=us-central1

# Deploy with Cloud SQL Proxy
gcloud run deploy organizeme-backend \
  --image gcr.io/PROJECT_ID/organizeme-backend \
  --add-cloudsql-instances PROJECT_ID:us-central1:organizeme-db
```

### cloudbuild.yaml Example

```yaml
steps:
  # Build backend
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/organizeme-backend', '.']
  
  # Push backend
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/organizeme-backend']
  
  # Build frontend
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/organizeme-frontend', './Frontend']
  
  # Push frontend
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/organizeme-frontend']

images:
  - 'gcr.io/$PROJECT_ID/organizeme-backend'
  - 'gcr.io/$PROJECT_ID/organizeme-frontend'
```

---

## Azure

### Azure Container Instances

```bash
# Install Azure CLI
# Login
az login

# Create resource group
az group create -n organizeme-rg -l eastus

# Build and push to Azure Container Registry
az acr create -g organizeme-rg -n organizemeregistry --sku Basic

# Login to ACR
az acr login -n organizemeregistry

# Tag and push images
docker tag organizeme-backend organizemeregistry.azurecr.io/organizeme-backend:latest
docker push organizemeregistry.azurecr.io/organizeme-backend:latest

# Deploy containers
az container create \
  -g organizeme-rg \
  -n organizeme-backend \
  --image organizemeregistry.azurecr.io/organizeme-backend:latest \
  --registry-login-server organizemeregistry.azurecr.io \
  --registry-username <username> \
  --registry-password <password> \
  -e NODE_ENV=production PORT=3000
```

### Azure Kubernetes Service (AKS)

```bash
# Create AKS cluster
az aks create \
  -g organizeme-rg \
  -n organizeme-aks \
  --node-count 2 \
  --enable-addons monitoring

# Get credentials
az aks get-credentials -g organizeme-rg -n organizeme-aks

# Deploy using kubectl
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/postgres-statefulset.yaml
```

---

## Render

Render provides simple Docker deployment without verbose configuration.

```bash
# 1. Push code to GitHub
git push origin main

# 2. Create Render account and connect GitHub
# https://render.com

# 3. Create new service
# - Choose Docker
# - Point to your repository
# - Set environment variables:
#   DB_HOST=postgres-service
#   DB_USER=admin
#   DB_PASSWORD=secure_password
#   NODE_ENV=production

# 4. Deploy automatically on push
```

### render.yaml Template

```yaml
services:
  - type: web
    name: organizeme-backend
    dockerfile: Dockerfile
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000

  - type: web
    name: organizeme-frontend
    dockerfile: Frontend/Dockerfile
    envVars:
      - key: VITE_API_URL
        scope: build_and_runtime
        value: https://organizeme-backend.onrender.com

  - type: pserv
    name: organizeme-db
    image:
      registry: docker
      name: postgres:16-alpine
    envVars:
      - key: POSTGRES_USER
        value: admin
      - key: POSTGRES_PASSWORD
        value: secure_password
      - key: POSTGRES_DB
        value: organizeme
```

---

## Railway

Simple Docker deployment with minimal configuration.

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
railway init

# 4. Create services
railway service add postgres
railway service add dockerfile organizeme-backend ./
railway service add dockerfile organizeme-frontend ./Frontend

# 5. Set variables
railway variable set DB_USER admin
railway variable set DB_PASSWORD secure_password
railway variable set NODE_ENV production

# 6. Deploy
railway up
```

---

## DigitalOcean

### App Platform (Docker Compose)

```bash
# 1. Create app.yaml
cat > app.yaml << 'EOF'
name: organizeme
services:
  - dockerfile_path: Dockerfile
    name: backend
    envs:
      - key: NODE_ENV
        value: production
      - key: DB_HOST
        value: db
    http_port: 5000
    internal_ports:
      - 5000

  - dockerfile_path: Frontend/Dockerfile
    name: frontend
    envs:
      - key: VITE_API_URL
        value: http://backend
    http_port: 80

  - name: db
    image:
      registry: docker
      registry_type: DOCKER_HUB
      repository: postgres
      tag: "16-alpine"
    envs:
      - key: POSTGRES_USER
        value: admin
      - key: POSTGRES_PASSWORD
        value: secure_password
      - key: POSTGRES_DB
        value: organizeme
EOF

# 2. Push to GitHub
git add app.yaml
git push

# 3. Deploy via DigitalOcean App Platform UI
# https://cloud.digitalocean.com/apps
```

### Droplet with Docker

```bash
# SSH into Droplet
ssh root@your-droplet-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Clone repository
git clone your-repo.git
cd OrganizeMe

# Setup environment and deploy
cp .env.example .env
# Edit .env with production values
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## Heroku

### Deploy with Docker

```bash
# Login
heroku login

# Create app
heroku create organizeme-app

# Add PostgreSQL plugin
heroku addons:create heroku-postgresql:hobby-dev -a organizeme-app

# Set environment variables
heroku config:set NODE_ENV=production \
  JWT_SECRET=your_secret \
  CLIENT_URL=https://organizeme-app.herokuapp.com \
  -a organizeme-app

# Deploy
git push heroku main

# View logs
heroku logs --tail -a organizeme-app
```

### heroku.yml

```yaml
build:
  docker:
    web: Dockerfile
    release: node migrations/migrate.js
web:
  Processes:
    web: npm start
run:
  web: npm start
```

---

## General Deployment Checklist

- [ ] Build Docker images
- [ ] Push to container registry
- [ ] Configure database (managed service or container)
- [ ] Set environment variables securely
- [ ] Configure domain/DNS
- [ ] Setup SSL/TLS certificates
- [ ] Configure logging
- [ ] Setup monitoring and alerts
- [ ] Configure backups
- [ ] Test application
- [ ] Setup CI/CD pipeline
- [ ] Document deployment process
- [ ] Plan scaling strategy
- [ ] Setup health checks
- [ ] Configure auto-restart policies

---

## Useful Links

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [GCP Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Azure Container Services](https://azure.microsoft.com/services/container-instances/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
