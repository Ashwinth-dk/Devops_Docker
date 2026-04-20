# Kubernetes Quick Reference

## One-liner deployments

### Deploy everything:
```powershell
kubectl apply -f kubernetes/
```

### Clean up:
```powershell
kubectl delete ns organizeme
```

### Check status:
```powershell
kubectl get all -n organizeme
```

### Port forwarding (Docker Desktop/Minikube):
```powershell
# Run all 4 in separate terminals:
kubectl port-forward -n organizeme svc/backend-service 5000:5000
kubectl port-forward -n organizeme svc/frontend-service 3000:3000
kubectl port-forward -n organizeme svc/jenkins-service 8080:8080
kubectl port-forward -n organizeme svc/postgres-service 5432:5432
```

### View live logs:
```powershell
kubectl logs -n organizeme -l app=backend -f
kubectl logs -n organizeme -l app=frontend -f
```

### Scale services:
```powershell
kubectl scale deployment backend --replicas=3 -n organizeme
kubectl scale deployment frontend --replicas=3 -n organizeme
```

### Restart services:
```powershell
kubectl rollout restart deployment/backend -n organizeme
kubectl rollout restart deployment/frontend -n organizeme
```

### SSH into pod:
```powershell
kubectl exec -it -n organizeme $(kubectl get pods -n organizeme -l app=backend -o jsonpath='{.items[0].metadata.name}') -- /bin/sh
```
