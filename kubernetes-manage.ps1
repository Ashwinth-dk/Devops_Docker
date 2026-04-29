# Kubernetes Management Script for OrganizeMe
# Usage: .\kubernetes-manage.ps1 -action [deploy|status|logs|cleanup|portforward|scale]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("deploy", "status", "logs", "cleanup", "portforward", "scale", "build")]
    [string]$action,
    
    [string]$service = "all",
    [int]$replicas = 2
)

$kubeNamespace = "organizeme"
$kubeDir = "kubernetes"

function Build-Images {
    Write-Host "Building Docker images..." -ForegroundColor Green
    docker build -t organizeme-backend:local -f Dockerfile .
    docker build -t organizeme-frontend:local -f Frontend/Dockerfile ./Frontend
    Write-Host "Images built successfully!" -ForegroundColor Green
}

function Deploy {
    Write-Host "Deploying to Kubernetes..." -ForegroundColor Green
    
    # Apply resources in order
    Write-Host "1. Creating namespace..." -ForegroundColor Cyan
    kubectl apply -f $kubeDir/namespace.yaml
    Start-Sleep -Seconds 2
    
    Write-Host "2. Creating config and secrets..." -ForegroundColor Cyan
    kubectl apply -f $kubeDir/configmap.yaml
    kubectl apply -f $kubeDir/secret.yaml
    Start-Sleep -Seconds 2
    
    Write-Host "3. Creating database..." -ForegroundColor Cyan
    kubectl apply -f $kubeDir/postgres-deployment.yaml
    Start-Sleep -Seconds 5
    
    Write-Host "4. Creating backend and frontend..." -ForegroundColor Cyan
    kubectl apply -f $kubeDir/backend-deployment.yaml
    kubectl apply -f $kubeDir/frontend-deployment.yaml
    Start-Sleep -Seconds 3
    
    Write-Host "5. Creating Jenkins..." -ForegroundColor Cyan
    kubectl apply -f $kubeDir/jenkins-deployment.yaml
    Start-Sleep -Seconds 3
    
    Write-Host "6. Creating Prometheus and Grafana..." -ForegroundColor Cyan
    kubectl apply -f $kubeDir/prometheus-configmap.yaml
    kubectl apply -f $kubeDir/prometheus-deployment.yaml
    kubectl apply -f $kubeDir/grafana-configmap.yaml
    kubectl apply -f $kubeDir/grafana-dashboard-provider.yaml
    kubectl apply -f $kubeDir/grafana-dashboards.yaml
    kubectl apply -f $kubeDir/grafana-deployment.yaml
    Start-Sleep -Seconds 3
    
    Write-Host "Deployment complete!" -ForegroundColor Green
    kubectl get all -n $kubeNamespace
}

function Get-Status {
    Write-Host "=== Namespace ===" -ForegroundColor Cyan
    kubectl get ns $kubeNamespace
    
    Write-Host "`n=== Pods ===" -ForegroundColor Cyan
    kubectl get pods -n $kubeNamespace
    
    Write-Host "`n=== Services ===" -ForegroundColor Cyan
    kubectl get svc -n $kubeNamespace
    
    Write-Host "`n=== Deployments ===" -ForegroundColor Cyan
    kubectl get deployments -n $kubeNamespace
}

function View-Logs {
    if ($service -eq "all") {
        Write-Host "Viewing logs for all services..." -ForegroundColor Green
        kubectl logs -n $kubeNamespace -l app=backend --tail=50
        kubectl logs -n $kubeNamespace -l app=frontend --tail=50
        kubectl logs -n $kubeNamespace -l app=prometheus --tail=50
        kubectl logs -n $kubeNamespace -l app=grafana --tail=50
    } else {
        Write-Host "Viewing logs for $service..." -ForegroundColor Green
        switch ($service) {
            "prometheus" { kubectl logs -n $kubeNamespace -l app=prometheus -f --all-containers=true }
            "grafana" { kubectl logs -n $kubeNamespace -l app=grafana -f --all-containers=true }
            default { kubectl logs -n $kubeNamespace -l app=$service -f --all-containers=true }
        }
    }
}

function Cleanup {
    Write-Host "Deleting namespace and all resources..." -ForegroundColor Yellow
    $confirm = Read-Host "Are you sure? (yes/no)"
    if ($confirm -eq "yes") {
        kubectl delete ns $kubeNamespace
        Write-Host "Cleanup complete!" -ForegroundColor Green
    }
}

function Setup-PortForward {
    Write-Host "Setting up port forwarding..." -ForegroundColor Green
    Write-Host "Run each in a separate terminal:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Backend (5000):" -ForegroundColor Cyan
    Write-Host "kubectl port-forward -n $kubeNamespace svc/backend-service 5000:5000" -ForegroundColor Green
    Write-Host ""
    Write-Host "Frontend (3000):" -ForegroundColor Cyan
    Write-Host "kubectl port-forward -n $kubeNamespace svc/frontend-service 3000:3000" -ForegroundColor Green
    Write-Host ""
    Write-Host "Jenkins (8080):" -ForegroundColor Cyan
    Write-Host "kubectl port-forward -n $kubeNamespace svc/jenkins-service 8080:8080" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prometheus (9090):" -ForegroundColor Cyan
    Write-Host "kubectl port-forward -n $kubeNamespace svc/prometheus-service 9090:9090" -ForegroundColor Green
    Write-Host ""
    Write-Host "Grafana (3001):" -ForegroundColor Cyan
    Write-Host "kubectl port-forward -n $kubeNamespace svc/grafana-service 3001:3000" -ForegroundColor Green
    Write-Host ""
    Write-Host "PostgreSQL (5432):" -ForegroundColor Cyan
    Write-Host "kubectl port-forward -n $kubeNamespace svc/postgres-service 5432:5432" -ForegroundColor Green
}

function Scale-Service {
    if ($service -eq "all") {
        Write-Host "Scaling backend to $replicas replicas..." -ForegroundColor Green
        kubectl scale deployment backend --replicas=$replicas -n $kubeNamespace
        
        Write-Host "Scaling frontend to $replicas replicas..." -ForegroundColor Green
        kubectl scale deployment frontend --replicas=$replicas -n $kubeNamespace
    } else {
        Write-Host "Scaling $service to $replicas replicas..." -ForegroundColor Green
        kubectl scale deployment $service --replicas=$replicas -n $kubeNamespace
    }
    
    Write-Host "Scaling complete!" -ForegroundColor Green
    kubectl get deployments -n $kubeNamespace
}

# Execute action
switch ($action) {
    "build" { Build-Images }
    "deploy" { Deploy }
    "status" { Get-Status }
    "logs" { View-Logs }
    "cleanup" { Cleanup }
    "portforward" { Setup-PortForward }
    "scale" { Scale-Service }
    default { Write-Host "Unknown action: $action" }
}
