#!/bin/bash

# Скрипт для развертывания микросервисной архитектуры в Kubernetes
# Автор: Дипломный проект
# Версия: 1.0

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для логирования
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Проверка зависимостей
check_dependencies() {
    log "Проверка зависимостей..."
    
    if ! command -v kubectl &> /dev/null; then
        error "kubectl не установлен. Установите kubectl и попробуйте снова."
        exit 1
    fi
    
    if ! kubectl cluster-info &> /dev/null; then
        error "Нет подключения к Kubernetes кластеру. Проверьте конфигурацию kubectl."
        exit 1
    fi
    
    log "Все зависимости установлены ✅"
}

# Создание namespace
create_namespace() {
    log "Создание namespace..."
    
    kubectl apply -f k8s/namespace.yaml
    
    # Ожидание готовности namespace
    kubectl wait --for=condition=Active namespace/messenger --timeout=60s
    
    log "Namespace создан ✅"
}

# Применение ConfigMaps и Secrets
apply_configs() {
    log "Применение конфигураций..."
    
    # ConfigMaps
    kubectl apply -f k8s/configmaps.yaml
    kubectl apply -f k8s/postgres-init-configmap.yaml
    
    # Secrets
    kubectl apply -f k8s/secrets.yaml
    
    log "Конфигурации применены ✅"
}

# Развертывание PostgreSQL
deploy_postgres() {
    log "Развертывание PostgreSQL..."
    
    # Применение манифестов PostgreSQL
    kubectl apply -f k8s/deployments/postgres.yaml
    
    # Ожидание готовности PostgreSQL master
    info "Ожидание готовности PostgreSQL master..."
    kubectl wait --for=condition=available deployment/postgres-master -n messenger --timeout=300s
    
    # Ожидание готовности PostgreSQL slave
    info "Ожидание готовности PostgreSQL slave..."
    kubectl wait --for=condition=available deployment/postgres-slave -n messenger --timeout=300s
    
    log "PostgreSQL развернут ✅"
}

# Развертывание микросервисов
deploy_microservices() {
    log "Развертывание микросервисов..."
    
    # Развертывание сервисов по порядку
    info "Развертывание auth-service..."
    kubectl apply -f k8s/deployments/auth-service.yaml
    kubectl wait --for=condition=available deployment/auth-service -n messenger --timeout=300s
    
    info "Развертывание message-service..."
    kubectl apply -f k8s/deployments/message-service.yaml
    kubectl wait --for=condition=available deployment/message-service -n messenger --timeout=300s
    
    info "Развертывание notification-service..."
    kubectl apply -f k8s/deployments/notification-service.yaml
    kubectl wait --for=condition=available deployment/notification-service -n messenger --timeout=300s
    
    info "Развертывание monitoring-service..."
    kubectl apply -f k8s/deployments/monitoring-service.yaml
    kubectl wait --for=condition=available deployment/monitoring-service -n messenger --timeout=300s
    
    log "Микросервисы развернуты ✅"
}

# Развертывание Nginx Gateway
deploy_nginx() {
    log "Развертывание Nginx Gateway..."
    
    kubectl apply -f k8s/deployments/nginx.yaml
    kubectl wait --for=condition=available deployment/nginx-gateway -n messenger --timeout=300s
    
    log "Nginx Gateway развернут ✅"
}

# Применение Services
apply_services() {
    log "Применение Services..."
    
    kubectl apply -f k8s/services.yaml
    
    log "Services применены ✅"
}

# Применение Ingress
apply_ingress() {
    log "Применение Ingress..."
    
    kubectl apply -f k8s/ingress.yaml
    
    log "Ingress применен ✅"
}

# Применение HPA
apply_hpa() {
    log "Применение Horizontal Pod Autoscaler..."
    
    kubectl apply -f k8s/hpa.yaml
    
    log "HPA применен ✅"
}

# Применение Network Policies
apply_network_policies() {
    log "Применение Network Policies..."
    
    kubectl apply -f k8s/network-policies.yaml
    
    log "Network Policies применены ✅"
}

# Проверка состояния развертывания
check_deployment_status() {
    log "Проверка состояния развертывания..."
    
    echo ""
    info "Статус подов:"
    kubectl get pods -n messenger -o wide
    
    echo ""
    info "Статус сервисов:"
    kubectl get services -n messenger
    
    echo ""
    info "Статус ingress:"
    kubectl get ingress -n messenger
    
    echo ""
    info "Статус HPA:"
    kubectl get hpa -n messenger
    
    echo ""
    info "Статус PVC:"
    kubectl get pvc -n messenger
    
    log "Проверка завершена ✅"
}

# Получение информации о доступе
get_access_info() {
    log "Информация о доступе к приложению:"
    
    # Получение внешнего IP LoadBalancer
    EXTERNAL_IP=$(kubectl get service nginx-gateway-service -n messenger -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")
    
    if [ "$EXTERNAL_IP" = "pending" ] || [ -z "$EXTERNAL_IP" ]; then
        EXTERNAL_IP=$(kubectl get service nginx-gateway-service -n messenger -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "localhost")
    fi
    
    echo ""
    echo "🌐 Доступ к приложению:"
    echo "   Frontend: http://$EXTERNAL_IP"
    echo "   API: http://$EXTERNAL_IP/api"
    echo ""
    echo "🔍 Мониторинг:"
    echo "   Metrics: http://$EXTERNAL_IP/metrics"
    echo "   Health: http://$EXTERNAL_IP/health"
    echo ""
    echo "📊 Kubernetes Dashboard:"
    echo "   kubectl proxy"
    echo "   http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/"
    echo ""
    echo "🔧 Полезные команды:"
    echo "   kubectl get all -n messenger"
    echo "   kubectl logs -f deployment/auth-service -n messenger"
    echo "   kubectl describe pod <pod-name> -n messenger"
    echo "   kubectl port-forward service/postgres-master-service 5432:5432 -n messenger"
}

# Основная функция
main() {
    log "🚀 Развертывание микросервисной архитектуры в Kubernetes"
    
    check_dependencies
    create_namespace
    apply_configs
    deploy_postgres
    
    info "Ожидание инициализации PostgreSQL..."
    sleep 60
    
    deploy_microservices
    deploy_nginx
    apply_services
    apply_ingress
    apply_hpa
    apply_network_policies
    
    info "Ожидание стабилизации системы..."
    sleep 30
    
    check_deployment_status
    get_access_info
    
    log "🎉 Развертывание завершено успешно!"
}

# Обработка сигналов
trap 'error "Прерывание выполнения"; exit 1' INT TERM

# Запуск основной функции
main "$@"
