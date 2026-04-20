# Kubernetes Deployment for OrganizeMe

This directory contains Kubernetes manifests to deploy the OrganizeMe application to any Kubernetes cluster.

## Prerequisites

1. **Kubernetes Cluster** (Minikube, Docker Desktop K8s, EKS, AKS, GKE, etc.)
2. **kubectl** CLI installed and configured
3. **Docker images** built and available:
   - `organizeme-backend:latest`
   - `organizeme-frontend:latest`

## Quick Start

### 1. Build Docker images locally
```powershell
cd D:\3 Year\Projects\Docker_Me-main\Docker_Me-main
docker build -t organizeme-backend:latest -f Dockerfile .
docker build -t organizeme-frontend:latest -f Frontend/Dockerfile ./Frontend
```

### 2. For local testing with Docker Desktop Kubernetes:
```powershell
# Enable Kubernetes in Docker Desktop:
# Settings → Kubernetes → Enable Kubernetes

# Verify connection:
kubectl cluster-info
kubectl get nodes
```

### 3. Deploy to Kubernetes:
```powershell
# Apply all manifests
kubectl apply -f kubernetes/

# Or apply individually:
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/secret.yaml
kubectl apply -f kubernetes/postgres-deployment.yaml
kubectl apply -f kubernetes/backend-deployment.yaml
kubectl apply -f kubernetes/frontend-deployment.yaml
kubectl apply -f kubernetes/jenkins-deployment.yaml
```

### 4. Verify deployment:
```powershell
# Check namespace
kubectl get ns organizeme

# Check all resources
kubectl get all -n organizeme

# Check pods status
kubectl get pods -n organizeme

# Check services
kubectl get svc -n organizeme
```

### 5. Access the services:

**For local Docker Desktop:**
```powershell
# PostgreSQL (internal only)
kubectl port-forward -n organizeme svc/postgres-service 5432:5432

# Backend API
kubectl port-forward -n organizeme svc/backend-service 5000:5000

# Frontend Web App
kubectl port-forward -n organizeme svc/frontend-service 3000:3000

# Jenkins
kubectl port-forward -n organizeme svc/jenkins-service 8080:8080
```

Then access:
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000`
- Jenkins: `http://localhost:8080`

**For cloud clusters (AWS EKS, Azure AKS, GCP GKE):**
```powershell
# Get external IPs
kubectl get svc -n organizeme

# Access via LoadBalancer external IP
http://<EXTERNAL-IP>:5000    # Backend
http://<EXTERNAL-IP>:3000    # Frontend
http://<EXTERNAL-IP>:8080    # Jenkins
```

## Manifest Files

- **namespace.yaml** - Creates `organizeme` namespace
- **configmap.yaml** - Environment configuration
- **secret.yaml** - Sensitive credentials (edit before production)
- **postgres-deployment.yaml** - PostgreSQL database with persistent storage
- **backend-deployment.yaml** - Node.js backend with 2 replicas
- **frontend-deployment.yaml** - React frontend with 2 replicas and nginx
- **jenkins-deployment.yaml** - Jenkins CI/CD with persistent storage

## Useful Commands

### View logs:
```powershell
# Pod logs
kubectl logs -n organizeme <pod-name>

# Follow logs
kubectl logs -n organizeme <pod-name> -f

# All pods
kubectl logs -n organizeme -l app=backend --all-containers=true
```

### Exec into pod:
```powershell
kubectl exec -it -n organizeme <pod-name> -- /bin/sh
```

### Describe resources:
```powershell
kubectl describe pod -n organizeme <pod-name>
kubectl describe svc -n organizeme
```

### Scale replicas:
```powershell
kubectl scale deployment -n organizeme backend --replicas=3
kubectl scale deployment -n organizeme frontend --replicas=3
```

### Delete deployment:
```powershell
# Delete specific resource
kubectl delete deployment -n organizeme backend

# Delete entire namespace (removes all resources)
kubectl delete ns organizeme
```

### Watch resources:
```powershell
kubectl get pods -n organizeme -w
kubectl get svc -n organizeme -w
```

## Updating Configuration

### Update ConfigMap:
```powershell
kubectl set env deployment/backend -n organizeme NODE_ENV=staging --from=configmap/organizeme-config --overwrite
```

### Update Secret:
```powershell
# Edit and apply updated secret.yaml
kubectl apply -f kubernetes/secret.yaml

# Restart deployments to pick up new secrets
kubectl rollout restart deployment/backend -n organizeme
kubectl rollout restart deployment/frontend -n organizeme
```

### Update image:
```powershell
kubectl set image deployment/backend -n organizeme backend=organizeme-backend:v2.0 --record
kubectl rollout status deployment/backend -n organizeme
```

## Production Considerations

1. **Images**: Push to container registry (Docker Hub, ECR, ACR, GCR)
   ```powershell
   docker tag organizeme-backend:latest myregistry/organizeme-backend:v1.0
   docker push myregistry/organizeme-backend:v1.0
   # Update image in deployment YAML
   ```

2. **Secrets**: Use secret management tools (AWS Secrets Manager, HashiCorp Vault)
   - Never commit secrets to git
   - Use sealed secrets or external secret operators

3. **Storage**: Use managed services
   - AWS RDS for PostgreSQL
   - Update postgres-deployment to remove or use specific PVC

4. **Ingress**: Add ingress for routing instead of LoadBalancer
   ```yaml
   apiVersion: networking.k8s.io/v1
   kind: Ingress
   metadata:
     name: organizeme-ingress
     namespace: organizeme
   spec:
     rules:
     - host: organizeme.example.com
       http:
         paths:
         - path: /
           backend:
             service:
               name: frontend-service
               port:
                 number: 3000
     - host: api.organizeme.example.com
       http:
         paths:
         - path: /
           backend:
             service:
               name: backend-service
               port:
                 number: 5000
   ```

5. **Resource Limits**: Already configured in deployments, adjust as needed

6. **High Availability**:
   - Backend: 2 replicas (can increase)
   - Frontend: 2 replicas (can increase)
   - Use pod disruption budgets for safe updates

## Troubleshooting

### Pods not starting:
```powershell
kubectl describe pod -n organizeme <pod-name>
kubectl logs -n organizeme <pod-name>
```

### ImagePullBackOff:
- Ensure Docker images are built and available
- For remote registry, create imagePullSecret

### Services not accessible:
```powershell
kubectl get endpoints -n organizeme
kubectl get svc -n organizeme -o wide
```

### Database connection issues:
```powershell
# Test connection from backend pod
kubectl exec -it -n organizeme <backend-pod> -- /bin/sh
# Inside pod:
curl postgres-service:5432
```

## References

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [kubectl cheat sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
