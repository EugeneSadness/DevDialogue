#!/bin/bash

# Diploma Messenger DevOps Integration - Complete Installation Script
# Автор: Eugene Damm

set -e

echo "🚀 Начинаем установку DevOps инфраструктуры для мессенджера..."

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

# Проверка предварительных требований
check_requirements() {
    log "Проверка предварительных требований..."
    
    # Проверка Docker
    if ! command -v docker &> /dev/null; then
        error "Docker не установлен. Установите Docker и повторите попытку."
        exit 1
    fi
    
    # Проверка Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose не установлен. Установите Docker Compose и повторите попытку."
        exit 1
    fi
    
    # Проверка Kubernetes
    if ! command -v kubectl &> /dev/null; then
        warn "kubectl не найден. Kubernetes компоненты будут пропущены."
        SKIP_K8S=true
    fi
    
    log "✅ Предварительные требования проверены"
}

# Установка Docker компонентов
install_docker() {
    log "🐳 Установка Docker компонентов..."
    
    cd deployment
    docker-compose down 2>/dev/null || true
    docker-compose up -d
    
    log "✅ Docker компоненты запущены"
    log "📱 Мессенджер доступен по адресу: http://localhost:3000"
}

# Установка мониторинга
install_monitoring() {
    log "📊 Установка системы мониторинга..."
    
    cd ../monitoring
    
    # Запуск Prometheus
    if [ -f prometheus/prometheus.yml ]; then
        docker run -d \
            --name prometheus \
            -p 9090:9090 \
            -v $(pwd)/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml \
            prom/prometheus
        log "✅ Prometheus запущен на порту 9090"
    fi
    
    # Запуск Grafana
    docker run -d \
        --name grafana \
        -p 3001:3000 \
        -e GF_SECURITY_ADMIN_PASSWORD=admin \
        grafana/grafana
    
    log "✅ Grafana запущена на порту 3001 (admin/admin)"
}

# Установка логирования
install_logging() {
    log "📝 Установка системы логирования..."
    
    cd ../logging/elk-stack
    
    if [ -f docker-compose.yml ]; then
        docker-compose up -d
        log "✅ ELK Stack запущен"
        log "🔍 Kibana доступна по адресу: http://localhost:5601"
    else
        warn "Конфигурация ELK Stack не найдена"
    fi
}

# Установка безопасности
install_security() {
    log "🔒 Установка компонентов безопасности..."
    
    cd ../security/vault-setup
    
    if [ -f docker-compose.yml ]; then
        docker-compose up -d
        log "✅ HashiCorp Vault запущен"
        log "🔐 Vault UI доступен по адресу: http://localhost:8200"
    else
        warn "Конфигурация Vault не найдена"
    fi
}

# Установка базы данных
install_database() {
    log "🗄️ Установка PostgreSQL с репликацией..."
    
    cd ../database/postgres-replication
    
    if [ -f docker-compose.yml ]; then
        docker-compose up -d
        log "✅ PostgreSQL кластер с репликацией запущен"
    else
        warn "Конфигурация PostgreSQL репликации не найдена"
    fi
}

# Установка Kubernetes компонентов
install_kubernetes() {
    if [ "$SKIP_K8S" = true ]; then
        warn "Пропуск установки Kubernetes компонентов"
        return
    fi
    
    log "☸️ Установка Kubernetes компонентов..."
    
    cd ../k8s-manifests
    
    # Применение манифестов
    kubectl apply -f . 2>/dev/null || warn "Некоторые Kubernetes манифесты не удалось применить"
    
    log "✅ Kubernetes манифесты применены"
}

# Проверка статуса сервисов
check_services() {
    log "🔍 Проверка статуса сервисов..."
    
    echo -e "\n${BLUE}=== СТАТУС СЕРВИСОВ ===${NC}"
    
    # Проверка Docker контейнеров
    echo -e "\n${YELLOW}Docker контейнеры:${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    # Проверка доступности сервисов
    echo -e "\n${YELLOW}Доступность сервисов:${NC}"
    
    services=(
        "http://localhost:3000|Мессенджер"
        "http://localhost:3001|Grafana"
        "http://localhost:5601|Kibana"
        "http://localhost:8200|Vault"
        "http://localhost:9090|Prometheus"
    )
    
    for service in "${services[@]}"; do
        IFS='|' read -r url name <<< "$service"
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "✅ $name: ${GREEN}Доступен${NC} ($url)"
        else
            echo -e "❌ $name: ${RED}Недоступен${NC} ($url)"
        fi
    done
}

# Вывод информации о доступе
show_access_info() {
    echo -e "\n${BLUE}=== ИНФОРМАЦИЯ О ДОСТУПЕ ===${NC}"
    echo -e "📱 ${YELLOW}Мессенджер:${NC} http://localhost:3000"
    echo -e "📊 ${YELLOW}Grafana:${NC} http://localhost:3001 (admin/admin)"
    echo -e "🔍 ${YELLOW}Kibana:${NC} http://localhost:5601"
    echo -e "🔐 ${YELLOW}Vault:${NC} http://localhost:8200"
    echo -e "📈 ${YELLOW}Prometheus:${NC} http://localhost:9090"
    echo -e "\n${GREEN}🎉 Установка завершена успешно!${NC}"
}

# Основная функция
main() {
    log "Запуск установки DevOps инфраструктуры..."
    
    check_requirements
    
    # Переход в корневую директорию проекта
    cd "$(dirname "$0")/.."
    
    install_docker
    install_monitoring
    install_logging
    install_security
    install_database
    install_kubernetes
    
    sleep 10  # Ждем запуска сервисов
    
    check_services
    show_access_info
}

# Обработка сигналов
trap 'error "Установка прервана пользователем"; exit 1' INT TERM

# Запуск
main "$@"
