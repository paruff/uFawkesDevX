# Kubernetes Migration Guide

This guide helps you migrate the Developer Control Plane from Docker Compose to Kubernetes.

## Overview

The platform is designed with Kubernetes in mind, using patterns that translate directly to K8s resources.

## Pre-Migration Checklist

- [ ] Kubernetes cluster available (v1.24+)
- [ ] kubectl configured and connected
- [ ] Container registry for images
- [ ] Ingress controller installed (nginx recommended)
- [ ] StorageClass configured for PVCs
- [ ] Namespace created: `kubectl create namespace developerd`

## Step 1: Build and Push Images

```bash
# Build images
docker-compose build

# Tag for your registry
docker tag developerd-score-service:latest registry.example.com/developerd/score-service:1.0.0
docker tag developerd-plugin-manager:latest registry.example.com/developerd/plugin-manager:1.0.0

# Push to registry
docker push registry.example.com/developerd/score-service:1.0.0
docker push registry.example.com/developerd/plugin-manager:1.0.0
```

## Step 2: Create ConfigMaps

```bash
# Create ConfigMap for environment variables
kubectl create configmap developerd-config \
  --namespace=developerd \
  --from-literal=NODE_ENV=production \
  --from-literal=LOG_LEVEL=info \
  --from-literal=POSTGRES_USER=backstage \
  --from-literal=POSTGRES_DB=backstage

# Create ConfigMap for Backstage configuration
kubectl create configmap backstage-config \
  --namespace=developerd \
  --from-file=backstage/app-config.yaml

# Create ConfigMap for Nginx gateway
kubectl create configmap gateway-config \
  --namespace=developerd \
  --from-file=nginx.conf=gateway/nginx.conf
```

## Step 3: Create Secrets

```bash
# Create Secret for database credentials
kubectl create secret generic postgres-credentials \
  --namespace=developerd \
  --from-literal=password=<strong-random-password>
```

## Step 4: Create PersistentVolumeClaims

```yaml
# k8s/pvcs.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data
  namespace: developerd
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: che-data
  namespace: developerd
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: che-workspaces
  namespace: developerd
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
```

Apply:
```bash
kubectl apply -f k8s/pvcs.yaml
```

## Step 5: Deploy PostgreSQL

```yaml
# k8s/postgres.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: developerd
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_USER
          valueFrom:
            configMapKeyRef:
              name: developerd-config
              key: POSTGRES_USER
        - name: POSTGRES_DB
          valueFrom:
            configMapKeyRef:
              name: developerd-config
              key: POSTGRES_DB
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-credentials
              key: password
        volumeMounts:
        - name: postgres-data
          mountPath: /var/lib/postgresql/data
        - name: init-scripts
          mountPath: /docker-entrypoint-initdb.d
        livenessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - backstage
          initialDelaySeconds: 30
          periodSeconds: 10
      volumes:
      - name: postgres-data
        persistentVolumeClaim:
          claimName: postgres-data
      - name: init-scripts
        configMap:
          name: postgres-init
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: developerd
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
```

Apply:
```bash
kubectl apply -f k8s/postgres.yaml
```

## Step 6: Deploy Score Service

```yaml
# k8s/score-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: score-service
  namespace: developerd
spec:
  replicas: 2
  selector:
    matchLabels:
      app: score-service
  template:
    metadata:
      labels:
        app: score-service
    spec:
      containers:
      - name: score-service
        image: registry.example.com/developerd/score-service:1.0.0
        ports:
        - containerPort: 8081
          name: api
        - containerPort: 8082
          name: webhook
        env:
        - name: API_PORT
          value: "8081"
        - name: WEBHOOK_PORT
          value: "8082"
        - name: DATABASE_URL
          value: postgresql://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@postgres:5432/score
        - name: POSTGRES_USER
          valueFrom:
            configMapKeyRef:
              name: developerd-config
              key: POSTGRES_USER
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-credentials
              key: password
        envFrom:
        - configMapRef:
            name: developerd-config
        livenessProbe:
          httpGet:
            path: /health
            port: 8081
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8081
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: score-service
  namespace: developerd
spec:
  selector:
    app: score-service
  ports:
  - port: 8081
    targetPort: 8081
    name: api
  - port: 8082
    targetPort: 8082
    name: webhook
```

Apply:
```bash
kubectl apply -f k8s/score-service.yaml
```

## Step 7: Deploy Plugin Manager

```yaml
# k8s/plugin-manager.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: plugin-manager
  namespace: developerd
spec:
  replicas: 1
  selector:
    matchLabels:
      app: plugin-manager
  template:
    metadata:
      labels:
        app: plugin-manager
    spec:
      containers:
      - name: plugin-manager
        image: registry.example.com/developerd/plugin-manager:1.0.0
        ports:
        - containerPort: 8083
        env:
        - name: API_PORT
          value: "8083"
        envFrom:
        - configMapRef:
            name: developerd-config
        livenessProbe:
          httpGet:
            path: /health
            port: 8083
          initialDelaySeconds: 30
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: plugin-manager
  namespace: developerd
spec:
  selector:
    app: plugin-manager
  ports:
  - port: 8083
    targetPort: 8083
```

Apply:
```bash
kubectl apply -f k8s/plugin-manager.yaml
```

## Step 8: Deploy Backstage

```yaml
# k8s/backstage.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backstage
  namespace: developerd
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backstage
  template:
    metadata:
      labels:
        app: backstage
    spec:
      containers:
      - name: backstage
        image: backstage/backstage:latest
        ports:
        - containerPort: 7007
        env:
        - name: POSTGRES_HOST
          value: postgres
        - name: POSTGRES_PORT
          value: "5432"
        - name: POSTGRES_USER
          valueFrom:
            configMapKeyRef:
              name: developerd-config
              key: POSTGRES_USER
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-credentials
              key: password
        - name: POSTGRES_DB
          valueFrom:
            configMapKeyRef:
              name: developerd-config
              key: POSTGRES_DB
        volumeMounts:
        - name: config
          mountPath: /app/app-config.yaml
          subPath: app-config.yaml
        livenessProbe:
          httpGet:
            path: /healthcheck
            port: 7007
          initialDelaySeconds: 60
          periodSeconds: 10
      volumes:
      - name: config
        configMap:
          name: backstage-config
---
apiVersion: v1
kind: Service
metadata:
  name: backstage
  namespace: developerd
spec:
  selector:
    app: backstage
  ports:
  - port: 7007
    targetPort: 7007
```

Apply:
```bash
kubectl apply -f k8s/backstage.yaml
```

## Step 9: Deploy Eclipse Che

```yaml
# k8s/che.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: che
  namespace: developerd
spec:
  replicas: 1
  selector:
    matchLabels:
      app: che
  template:
    metadata:
      labels:
        app: che
    spec:
      containers:
      - name: che
        image: quay.io/eclipse/che-server:latest
        ports:
        - containerPort: 8080
        env:
        - name: CHE_HOST
          value: che.example.com
        - name: CHE_PORT
          value: "8080"
        volumeMounts:
        - name: che-data
          mountPath: /che/data
        - name: che-workspaces
          mountPath: /che/workspaces
      volumes:
      - name: che-data
        persistentVolumeClaim:
          claimName: che-data
      - name: che-workspaces
        persistentVolumeClaim:
          claimName: che-workspaces
---
apiVersion: v1
kind: Service
metadata:
  name: che
  namespace: developerd
spec:
  selector:
    app: che
  ports:
  - port: 8080
    targetPort: 8080
```

Apply:
```bash
kubectl apply -f k8s/che.yaml
```

## Step 10: Create Ingress

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: developerd-ingress
  namespace: developerd
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - platform.example.com
    secretName: developerd-tls
  rules:
  - host: platform.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: backstage
            port:
              number: 7007
      - path: /api/score(/|$)(.*)
        pathType: Prefix
        backend:
          service:
            name: score-service
            port:
              number: 8081
      - path: /webhooks/score(/|$)(.*)
        pathType: Prefix
        backend:
          service:
            name: score-service
            port:
              number: 8082
      - path: /api/plugins(/|$)(.*)
        pathType: Prefix
        backend:
          service:
            name: plugin-manager
            port:
              number: 8083
      - path: /che(/|$)(.*)
        pathType: Prefix
        backend:
          service:
            name: che
            port:
              number: 8080
```

Apply:
```bash
kubectl apply -f k8s/ingress.yaml
```

## Step 11: Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n developerd

# Check services
kubectl get svc -n developerd

# Check ingress
kubectl get ingress -n developerd

# View logs
kubectl logs -n developerd -l app=score-service -f
```

## Step 12: Update DNS

Point your domain to the Ingress controller's external IP:
```bash
kubectl get ingress -n developerd developerd-ingress -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

## Scaling

Scale services based on load:
```bash
# Scale Score service
kubectl scale deployment score-service -n developerd --replicas=5

# Scale Backstage
kubectl scale deployment backstage -n developerd --replicas=3
```

## Monitoring

Add Prometheus monitoring:
```yaml
# Add to deployments
metadata:
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "8081"
    prometheus.io/path: "/metrics"
```

## High Availability

For HA deployment:
1. Run PostgreSQL with replication (or use managed database)
2. Scale all services to 2+ replicas
3. Use PodDisruptionBudgets
4. Enable horizontal pod autoscaling
5. Deploy across multiple availability zones

## Rollback

If issues occur:
```bash
# Rollback deployment
kubectl rollout undo deployment score-service -n developerd

# Check rollout status
kubectl rollout status deployment score-service -n developerd
```

## Cleanup

To remove everything:
```bash
kubectl delete namespace developerd
```
