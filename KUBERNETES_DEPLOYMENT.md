# Kubernetes Deployment Guide

This guide shows how to deploy OrganizeMe to different Kubernetes platforms.

## Table of Contents

1. [Local Kubernetes (Docker Desktop / Minikube)](#local-kubernetes)
2. [AWS EKS](#aws-eks)
3. [Azure AKS](#azure-aks)
4. [Google Cloud GKE](#google-cloud-gke)

---

## Local Kubernetes

### Option 1: Docker Desktop

**Prerequisites:**
- Docker Desktop installed
- Kubernetes enabled in Docker Desktop settings

**Steps:**

1. Enable Kubernetes in Docker Desktop:
   - Click Docker icon → Settings → Kubernetes → Enable Kubernetes
   - Wait for it to start (~2 minutes)

2. Verify connection:
```powershell
kubectl cluster-info
kubectl get nodes
```

3. Build images:
```powershell
.\kubernetes-manage.ps1 -action build
```

4. Deploy:
```powershell
.\kubernetes-manage.ps1 -action deploy
```

5. Check status:
```powershell
.\kubernetes-manage.ps1 -action status
```

6. Set up port forwarding in separate terminals:
```powershell
# Terminal 1: Backend
kubectl port-forward -n organizeme svc/backend-service 5000:5000

# Terminal 2: Frontend
kubectl port-forward -n organizeme svc/frontend-service 3000:3000

# Terminal 3: Jenkins
kubectl port-forward -n organizeme svc/jenkins-service 8080:8080

# Terminal 4: Database
kubectl port-forward -n organizeme svc/postgres-service 5432:5432
```

7. Access services:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000
   - Jenkins: http://localhost:8080

### Option 2: Minikube

**Prerequisites:**
- Minikube installed
- kubectl installed

**Steps:**

1. Start Minikube:
```bash
minikube start --cpus=4 --memory=8192
```

2. Use Minikube's Docker:
```bash
eval $(minikube docker-env)
```

3. Build images:
```bash
./kubernetes-manage.sh build
```

4. Deploy:
```bash
./kubernetes-manage.sh deploy
```

5. Get service URLs:
```bash
minikube service -n organizeme frontend-service
minikube service -n organizeme backend-service
minikube service -n organizeme jenkins-service
```

6. Or use port forwarding:
```bash
./kubernetes-manage.sh portforward
```

---

## AWS EKS

### Prerequisites:
- AWS Account
- AWS CLI configured: `aws configure`
- eksctl installed
- kubectl installed
- Docker images pushed to ECR

### Step 1: Create EKS Cluster

```bash
eksctl create cluster \
  --name organizeme-cluster \
  --region us-east-1 \
  --nodegroup-name standard-nodes \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 2 \
  --nodes-max 5
```

### Step 2: Configure kubectl

```bash
aws eks update-kubeconfig \
  --region us-east-1 \
  --name organizeme-cluster
```

### Step 3: Push Docker images to ECR

```bash
# Create ECR repositories
aws ecr create-repository --repository-name organizeme-backend --region us-east-1
aws ecr create-repository --repository-name organizeme-frontend --region us-east-1

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# Tag and push backend
docker tag organizeme-backend:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/organizeme-backend:latest
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/organizeme-backend:latest

# Tag and push frontend
docker tag organizeme-frontend:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/organizeme-frontend:latest
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/organizeme-frontend:latest
```

### Step 4: Update manifests

Update `backend-deployment.yaml` and `frontend-deployment.yaml` image paths:
```yaml
image: <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/organizeme-backend:latest
imagePullPolicy: Always
```

### Step 5: Deploy

```bash
kubectl apply -f kubernetes/
```

### Step 6: Access services

```bash
# Get external IPs (may take a minute)
kubectl get svc -n organizeme

# Access via LoadBalancer IP
# Example: http://af123456.us-east-1.elb.amazonaws.com:3000
```

### Step 7: Set up RDS for production

```bash
# Instead of Kubernetes postgres deployment, use AWS RDS
# Update secret with RDS endpoint
kubectl set env deployment/backend -n organizeme DB_HOST=organizeme-db.xxxx.us-east-1.rds.amazonaws.com
```

---

## Azure AKS

### Prerequisites:
- Azure Account
- Azure CLI installed: `az login`
- kubectl installed
- Docker images pushed to ACR

### Step 1: Create resource group

```bash
az group create --name organizeme-rg --location eastus
```

### Step 2: Create ACR (Azure Container Registry)

```bash
az acr create --resource-group organizeme-rg \
  --name organizemeacr \
  --sku Basic
```

### Step 3: Push Docker images to ACR

```bash
# Login to ACR
az acr login --name organizemeacr

# Tag images
docker tag organizeme-backend:latest organizemeacr.azurecr.io/organizeme-backend:latest
docker tag organizeme-frontend:latest organizemeacr.azurecr.io/organizeme-frontend:latest

# Push
docker push organizemeacr.azurecr.io/organizeme-backend:latest
docker push organizemeacr.azurecr.io/organizeme-frontend:latest
```

### Step 4: Create AKS cluster

```bash
az aks create \
  --resource-group organizeme-rg \
  --name organizeme-aks \
  --node-count 2 \
  --vm-set-type VirtualMachineScaleSets \
  --load-balancer-sku standard \
  --enable-managed-identity \
  --network-plugin azure \
  --attach-acr organizemeacr
```

### Step 5: Get credentials

```bash
az aks get-credentials --resource-group organizeme-rg --name organizeme-aks
```

### Step 6: Update manifests

Update image paths in deployments:
```yaml
image: organizemeacr.azurecr.io/organizeme-backend:latest
imagePullPolicy: Always
```

### Step 7: Deploy

```bash
kubectl apply -f kubernetes/
```

### Step 8: Access services

```bash
# Get external IPs
kubectl get svc -n organizeme

# Access via LoadBalancer IP
```

---

## Google Cloud GKE

### Prerequisites:
- Google Cloud Account
- gcloud CLI installed: `gcloud init`
- kubectl installed
- Docker images pushed to GCR

### Step 1: Set project

```bash
gcloud config set project PROJECT_ID
gcloud auth configure-docker
```

### Step 2: Push Docker images to GCR

```bash
# Tag images
docker tag organizeme-backend:latest gcr.io/PROJECT_ID/organizeme-backend:latest
docker tag organizeme-frontend:latest gcr.io/PROJECT_ID/organizeme-frontend:latest

# Push
docker push gcr.io/PROJECT_ID/organizeme-backend:latest
docker push gcr.io/PROJECT_ID/organizeme-frontend:latest
```

### Step 3: Create GKE cluster

```bash
gcloud container clusters create organizeme-cluster \
  --zone us-central1-a \
  --num-nodes 2 \
  --machine-type n1-standard-2 \
  --enable-stackdriver-kubernetes
```

### Step 4: Get credentials

```bash
gcloud container clusters get-credentials organizeme-cluster --zone us-central1-a
```

### Step 5: Update manifests

Update image paths:
```yaml
image: gcr.io/PROJECT_ID/organizeme-backend:latest
imagePullPolicy: Always
```

### Step 6: Deploy

```bash
kubectl apply -f kubernetes/
```

### Step 7: Access services

```bash
# Get external IPs
kubectl get svc -n organizeme

# Access via LoadBalancer IP
```

---

## Common Tasks

### Scaling

```bash
# Scale backend to 5 replicas
./kubernetes-manage.ps1 -action scale -service backend -replicas 5

# Scale frontend to 3 replicas
./kubernetes-manage.ps1 -action scale -service frontend -replicas 3
```

### Monitoring

```bash
# Watch pods
kubectl get pods -n organizeme -w

# View logs
./kubernetes-manage.ps1 -action logs -service backend

# Describe pod
kubectl describe pod -n organizeme POD_NAME
```

### Updates

```bash
# Update deployment image
kubectl set image deployment/backend -n organizeme \
  backend=organizemeacr.azurecr.io/organizeme-backend:v2.0

# Check rollout status
kubectl rollout status deployment/backend -n organizeme

# Rollback if needed
kubectl rollout undo deployment/backend -n organizeme
```

### Cleanup

```bash
# Delete namespace and all resources
./kubernetes-manage.ps1 -action cleanup

# For cloud clusters, also delete the cluster
# AWS: eksctl delete cluster --name organizeme-cluster
# Azure: az aks delete --resource-group organizeme-rg --name organizeme-aks
# GCP: gcloud container clusters delete organizeme-cluster
```

---

## Next Steps

1. Set up CI/CD pipeline to build and push images automatically
2. Use GitOps (ArgoCD) for automated deployments
3. Set up monitoring (Prometheus/Grafana)
4. Configure autoscaling (Horizontal Pod Autoscaler)
5. Use service mesh (Istio) for advanced traffic management
6. Enable ingress for domain-based routing
