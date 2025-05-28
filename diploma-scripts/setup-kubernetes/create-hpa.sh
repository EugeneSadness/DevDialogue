#!/bin/bash

# Скрипт для создания конфигурации Kubernetes HPA (Horizontal Pod Autoscaler)
# Основан на инструкциях из diploma/screenshots.md, раздел 2.3

set -e

echo "=== Создание конфигурации Kubernetes для мессенджера ==="

# Создаем директорию для Kubernetes манифестов
mkdir -p k8s-manifests
cd k8s-manifests

# Создаем Deployment для мессенджера
echo "Создание Deployment манифеста..."
cat > messenger-deployment.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: messenger-api
  labels:
    app: messenger-api
    version: v1.0.0
spec:
  replicas: 3
  selector:
    matchLabels:
      app: messenger-api
  template:
    metadata:
      labels:
        app: messenger-api
        version: v1.0.0
    spec:
      containers:
      - name: messenger-api
        image: messenger-service:latest
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: messenger-api-service
  labels:
    app: messenger-api
spec:
  selector:
    app: messenger-api
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
    name: http
  type: ClusterIP
EOF

# Создаем HPA манифест
echo "Создание HPA (Horizontal Pod Autoscaler) манифеста..."
cat > messenger-hpa.yaml << 'EOF'
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: messenger-api-hpa
  labels:
    app: messenger-api
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: messenger-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 4
        periodSeconds: 15
      selectPolicy: Max
EOF

# Создаем ConfigMap для конфигурации
echo "Создание ConfigMap манифеста..."
cat > messenger-configmap.yaml << 'EOF'
apiVersion: v1
kind: ConfigMap
metadata:
  name: messenger-config
  labels:
    app: messenger-api
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  API_VERSION: "v1.0.0"
  MAX_CONNECTIONS: "1000"
  CORS_ORIGIN: "*"
EOF

# Создаем Secret для чувствительных данных
echo "Создание Secret манифеста..."
cat > messenger-secret.yaml << 'EOF'
apiVersion: v1
kind: Secret
metadata:
  name: messenger-secrets
  labels:
    app: messenger-api
type: Opaque
data:
  # Значения закодированы в base64
  # Для примера: echo -n "your-secret-key" | base64
  JWT_SECRET: eW91ci1zZWNyZXQta2V5
  DB_PASSWORD: cGFzc3dvcmQxMjM=
  API_KEY: YXBpLWtleS0xMjM0NTY=
EOF

# Создаем Ingress для внешнего доступа
echo "Создание Ingress манифеста..."
cat > messenger-ingress.yaml << 'EOF'
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: messenger-ingress
  labels:
    app: messenger-api
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "false"
    nginx.ingress.kubernetes.io/cors-allow-origin: "*"
spec:
  rules:
  - host: messenger.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: messenger-api-service
            port:
              number: 80
  - host: api.messenger.local
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: messenger-api-service
            port:
              number: 80
EOF

# Создаем скрипт для применения всех манифестов
echo "Создание скрипта развертывания..."
cat > deploy.sh << 'EOF'
#!/bin/bash

echo "=== Развертывание мессенджера в Kubernetes ==="

# Проверяем подключение к кластеру
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Нет подключения к Kubernetes кластеру"
    exit 1
fi

# Создаем namespace, если его нет
kubectl create namespace messenger --dry-run=client -o yaml | kubectl apply -f -

# Применяем манифесты
echo "Применение ConfigMap..."
kubectl apply -f messenger-configmap.yaml -n messenger

echo "Применение Secret..."
kubectl apply -f messenger-secret.yaml -n messenger

echo "Применение Deployment..."
kubectl apply -f messenger-deployment.yaml -n messenger

echo "Применение HPA..."
kubectl apply -f messenger-hpa.yaml -n messenger

echo "Применение Ingress..."
kubectl apply -f messenger-ingress.yaml -n messenger

echo "✅ Развертывание завершено!"
echo ""
echo "Проверка статуса:"
kubectl get all -n messenger
echo ""
echo "Проверка HPA:"
kubectl get hpa -n messenger
EOF

chmod +x deploy.sh

echo "✅ Kubernetes манифесты созданы в директории k8s-manifests/"
echo ""
echo "Созданные файлы:"
ls -la

echo ""
echo "Содержимое HPA манифеста:"
echo "=========================="
cat messenger-hpa.yaml

echo ""
echo "Для развертывания в Kubernetes выполните:"
echo "cd k8s-manifests && ./deploy.sh"
echo ""
echo "Для проверки статуса HPA:"
echo "kubectl get hpa messenger-api-hpa -n messenger"
