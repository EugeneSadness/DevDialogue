#!/bin/bash

# Скрипт для удаления микросервисной архитектуры из Kubernetes
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
        error "kubectl не установлен."
        exit 1
    fi
    
    if ! kubectl cluster-info &> /dev/null; then
        error "Нет подключения к Kubernetes кластеру."
        exit 1
    fi
    
    log "Зависимости проверены ✅"
}

# Подтверждение удаления
confirm_deletion() {
    echo ""
    warn "⚠️  ВНИМАНИЕ: Это действие удалит все ресурсы мессенджера из Kubernetes!"
    warn "⚠️  Все данные в базах данных будут потеряны!"
    echo ""
    
    read -p "Вы уверены, что хотите продолжить? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        info "Операция отменена пользователем"
        exit 0
    fi
    
    echo ""
    warn "Последнее предупреждение! Введите 'DELETE' для подтверждения:"
    read -p "> " -r
    if [[ $REPLY != "DELETE" ]]; then
        info "Операция отменена пользователем"
        exit 0
    fi
}

# Удаление Network Policies
remove_network_policies() {
    log "Удаление Network Policies..."
    
    if kubectl get networkpolicies -n messenger &> /dev/null; then
        kubectl delete -f k8s/network-policies.yaml --ignore-not-found=true
        log "Network Policies удалены ✅"
    else
        info "Network Policies не найдены"
    fi
}

# Удаление HPA
remove_hpa() {
    log "Удаление Horizontal Pod Autoscaler..."
    
    if kubectl get hpa -n messenger &> /dev/null; then
        kubectl delete -f k8s/hpa.yaml --ignore-not-found=true
        log "HPA удален ✅"
    else
        info "HPA не найден"
    fi
}

# Удаление Ingress
remove_ingress() {
    log "Удаление Ingress..."
    
    if kubectl get ingress -n messenger &> /dev/null; then
        kubectl delete -f k8s/ingress.yaml --ignore-not-found=true
        log "Ingress удален ✅"
    else
        info "Ingress не найден"
    fi
}

# Удаление Services
remove_services() {
    log "Удаление Services..."
    
    if kubectl get services -n messenger &> /dev/null; then
        kubectl delete -f k8s/services.yaml --ignore-not-found=true
        log "Services удалены ✅"
    else
        info "Services не найдены"
    fi
}

# Удаление Deployments
remove_deployments() {
    log "Удаление Deployments..."
    
    # Удаление в обратном порядке
    info "Удаление Nginx Gateway..."
    kubectl delete -f k8s/deployments/nginx.yaml --ignore-not-found=true
    
    info "Удаление микросервисов..."
    kubectl delete -f k8s/deployments/monitoring-service.yaml --ignore-not-found=true
    kubectl delete -f k8s/deployments/notification-service.yaml --ignore-not-found=true
    kubectl delete -f k8s/deployments/message-service.yaml --ignore-not-found=true
    kubectl delete -f k8s/deployments/auth-service.yaml --ignore-not-found=true
    
    info "Удаление PostgreSQL..."
    kubectl delete -f k8s/deployments/postgres.yaml --ignore-not-found=true
    
    log "Deployments удалены ✅"
}

# Удаление ConfigMaps и Secrets
remove_configs() {
    log "Удаление конфигураций..."
    
    kubectl delete -f k8s/configmaps.yaml --ignore-not-found=true
    kubectl delete -f k8s/postgres-init-configmap.yaml --ignore-not-found=true
    kubectl delete -f k8s/secrets.yaml --ignore-not-found=true
    
    log "Конфигурации удалены ✅"
}

# Удаление PVC (опционально)
remove_pvcs() {
    read -p "Удалить Persistent Volume Claims (данные будут потеряны)? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Удаление PVC..."
        kubectl delete pvc --all -n messenger --ignore-not-found=true
        log "PVC удалены ✅"
    else
        info "PVC сохранены"
    fi
}

# Удаление namespace
remove_namespace() {
    read -p "Удалить namespace 'messenger'? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Удаление namespace..."
        kubectl delete namespace messenger --ignore-not-found=true
        log "Namespace удален ✅"
    else
        info "Namespace сохранен"
    fi
}

# Проверка оставшихся ресурсов
check_remaining_resources() {
    log "Проверка оставшихся ресурсов..."
    
    if kubectl get namespace messenger &> /dev/null; then
        echo ""
        info "Оставшиеся ресурсы в namespace messenger:"
        kubectl get all -n messenger 2>/dev/null || info "Нет ресурсов в namespace"
        
        echo ""
        info "PVC в namespace messenger:"
        kubectl get pvc -n messenger 2>/dev/null || info "Нет PVC в namespace"
    else
        info "Namespace messenger не существует"
    fi
}

# Очистка Docker образов (опционально)
cleanup_docker_images() {
    read -p "Очистить локальные Docker образы мессенджера? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Очистка Docker образов..."
        
        # Удаление образов мессенджера
        docker images | grep "messenger/" | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true
        
        # Очистка неиспользуемых образов
        docker image prune -f
        
        log "Docker образы очищены ✅"
    else
        info "Docker образы сохранены"
    fi
}

# Основная функция
main() {
    log "🗑️  Удаление микросервисной архитектуры из Kubernetes"
    
    check_dependencies
    confirm_deletion
    
    remove_network_policies
    remove_hpa
    remove_ingress
    remove_services
    remove_deployments
    remove_configs
    remove_pvcs
    remove_namespace
    
    check_remaining_resources
    cleanup_docker_images
    
    log "🎉 Удаление завершено!"
    echo ""
    info "Для полной очистки также выполните:"
    echo "   docker system prune -a"
    echo "   kubectl config delete-context <context-name>"
}

# Обработка сигналов
trap 'error "Прерывание выполнения"; exit 1' INT TERM

# Запуск основной функции
main "$@"
