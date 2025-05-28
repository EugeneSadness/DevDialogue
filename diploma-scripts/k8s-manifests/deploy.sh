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
