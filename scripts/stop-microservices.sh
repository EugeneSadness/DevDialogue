#!/bin/bash

# Скрипт для остановки микросервисной архитектуры мессенджера
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

# Остановка сервисов
stop_services() {
    log "Остановка микросервисов..."
    
    if docker-compose -f docker-compose.microservices.yml ps | grep -q "Up"; then
        docker-compose -f docker-compose.microservices.yml down
        log "Сервисы остановлены ✅"
    else
        info "Сервисы уже остановлены"
    fi
}

# Очистка ресурсов (опционально)
cleanup_resources() {
    read -p "Удалить Docker volumes с данными? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        warn "Удаление volumes с данными..."
        docker-compose -f docker-compose.microservices.yml down -v
        log "Volumes удалены ✅"
    fi
    
    read -p "Удалить Docker образы? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        warn "Удаление Docker образов..."
        docker-compose -f docker-compose.microservices.yml down --rmi all
        log "Образы удалены ✅"
    fi
}

# Показать статус
show_status() {
    log "Статус сервисов после остановки:"
    docker-compose -f docker-compose.microservices.yml ps
}

# Основная функция
main() {
    log "🛑 Остановка микросервисной архитектуры мессенджера"
    
    stop_services
    
    if [ "$1" = "--cleanup" ]; then
        cleanup_resources
    fi
    
    show_status
    
    log "✅ Микросервисная архитектура остановлена"
}

# Обработка сигналов
trap 'error "Прерывание выполнения"; exit 1' INT TERM

# Запуск основной функции
main "$@"
