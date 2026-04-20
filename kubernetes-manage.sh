#!/bin/bash

# Kubernetes Management Script for OrganizeMe
# Usage: ./kubernetes-manage.sh [deploy|status|logs|cleanup|portforward|scale|build]

KUBE_NAMESPACE="organizeme"
KUBE_DIR="kubernetes"

action=${1:-status}
service=${2:-all}
replicas=${3:-2}

build_images() {
    echo "Building Docker images..."
    docker build -t organizeme-backend:latest -f Dockerfile .
    docker build -t organizeme-frontend:latest -f Frontend/Dockerfile ./Frontend
    echo "✓ Images built successfully!"
}

deploy() {
    echo "Deploying to Kubernetes..."
    
    # Apply resources in order
    echo "1. Creating namespace..."
    kubectl apply -f $KUBE_DIR/namespace.yaml
    sleep 2
    
    echo "2. Creating config and secrets..."
    kubectl apply -f $KUBE_DIR/configmap.yaml
    kubectl apply -f $KUBE_DIR/secret.yaml
    sleep 2
    
    echo "3. Creating database..."
    kubectl apply -f $KUBE_DIR/postgres-deployment.yaml
    sleep 5
    
    echo "4. Creating backend and frontend..."
    kubectl apply -f $KUBE_DIR/backend-deployment.yaml
    kubectl apply -f $KUBE_DIR/frontend-deployment.yaml
    sleep 3
    
    echo "5. Creating Jenkins..."
    kubectl apply -f $KUBE_DIR/jenkins-deployment.yaml
    sleep 3
    
    echo "✓ Deployment complete!"
    kubectl get all -n $KUBE_NAMESPACE
}

get_status() {
    echo "=== Namespace ==="
    kubectl get ns $KUBE_NAMESPACE
    
    echo -e "\n=== Pods ==="
    kubectl get pods -n $KUBE_NAMESPACE
    
    echo -e "\n=== Services ==="
    kubectl get svc -n $KUBE_NAMESPACE
    
    echo -e "\n=== Deployments ==="
    kubectl get deployments -n $KUBE_NAMESPACE
}

view_logs() {
    if [ "$service" = "all" ]; then
        echo "Viewing logs for all services..."
        kubectl logs -n $KUBE_NAMESPACE -l app=backend --tail=50
        kubectl logs -n $KUBE_NAMESPACE -l app=frontend --tail=50
    else
        echo "Viewing logs for $service (follow mode)..."
        kubectl logs -n $KUBE_NAMESPACE -l app=$service -f --all-containers=true
    fi
}

cleanup() {
    echo "Deleting namespace and all resources..."
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
        kubectl delete ns $KUBE_NAMESPACE
        echo "✓ Cleanup complete!"
    fi
}

setup_portforward() {
    echo "Setting up port forwarding..."
    echo "Run each in a separate terminal:"
    echo ""
    echo "Backend (5000):"
    echo "kubectl port-forward -n $KUBE_NAMESPACE svc/backend-service 5000:5000"
    echo ""
    echo "Frontend (3000):"
    echo "kubectl port-forward -n $KUBE_NAMESPACE svc/frontend-service 3000:3000"
    echo ""
    echo "Jenkins (8080):"
    echo "kubectl port-forward -n $KUBE_NAMESPACE svc/jenkins-service 8080:8080"
    echo ""
    echo "PostgreSQL (5432):"
    echo "kubectl port-forward -n $KUBE_NAMESPACE svc/postgres-service 5432:5432"
}

scale_service() {
    if [ "$service" = "all" ]; then
        echo "Scaling backend to $replicas replicas..."
        kubectl scale deployment backend --replicas=$replicas -n $KUBE_NAMESPACE
        
        echo "Scaling frontend to $replicas replicas..."
        kubectl scale deployment frontend --replicas=$replicas -n $KUBE_NAMESPACE
    else
        echo "Scaling $service to $replicas replicas..."
        kubectl scale deployment $service --replicas=$replicas -n $KUBE_NAMESPACE
    fi
    
    echo "✓ Scaling complete!"
    kubectl get deployments -n $KUBE_NAMESPACE
}

# Execute action
case $action in
    build) build_images ;;
    deploy) deploy ;;
    status) get_status ;;
    logs) view_logs ;;
    cleanup) cleanup ;;
    portforward) setup_portforward ;;
    scale) scale_service ;;
    *)
        echo "Usage: $0 [build|deploy|status|logs|cleanup|portforward|scale] [service] [replicas]"
        echo ""
        echo "Examples:"
        echo "  $0 build                    # Build Docker images"
        echo "  $0 deploy                   # Deploy to Kubernetes"
        echo "  $0 status                   # Show deployment status"
        echo "  $0 logs backend             # View backend logs"
        echo "  $0 scale all 3              # Scale to 3 replicas"
        ;;
esac
