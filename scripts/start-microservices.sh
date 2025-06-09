#!/bin/bash

# Скрипт для запуска микросервисной архитектуры мессенджера
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
    
    if ! command -v docker &> /dev/null; then
        error "Docker не установлен. Установите Docker и попробуйте снова."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose не установлен. Установите Docker Compose и попробуйте снова."
        exit 1
    fi
    
    log "Все зависимости установлены ✅"
}

# Создание переменных окружения
create_env_file() {
    log "Создание файла переменных окружения..."
    
    if [ ! -f .env ]; then
        cat > .env << EOF
# Database Configuration
POSTGRES_PASSWORD=postgres_password
POSTGRES_REPLICATION_PASSWORD=replica_password

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=$(openssl rand -base64 32)
REFRESH_TOKEN_EXPIRES_IN=7d

# VAPID Keys for Push Notifications (generate with web-push)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:admin@messenger.local

# Service URLs
AUTH_SERVICE_URL=http://auth-service:3001
MESSAGE_SERVICE_URL=http://message-service:3002
NOTIFICATION_SERVICE_URL=http://notification-service:3003
MONITORING_SERVICE_URL=http://monitoring-service:3004

# Environment
NODE_ENV=production
EOF
        log "Файл .env создан ✅"
    else
        info "Файл .env уже существует"
    fi
}

# Сборка Docker образов
build_images() {
    log "Сборка Docker образов..."
    
    docker-compose -f docker-compose.microservices.yml build --no-cache
    
    log "Docker образы собраны ✅"
}

# Запуск сервисов
start_services() {
    log "Запуск микросервисов..."
    
    # Сначала запускаем базу данных
    info "Запуск PostgreSQL..."
    docker-compose -f docker-compose.microservices.yml up -d postgres-master postgres-slave
    
    # Ждем готовности базы данных
    info "Ожидание готовности PostgreSQL..."
    sleep 30
    
    # Проверяем подключение к базе данных
    until docker exec postgres-master pg_isready -U postgres; do
        info "Ожидание PostgreSQL..."
        sleep 5
    done
    
    log "PostgreSQL готов ✅"
    
    # Запускаем остальные сервисы
    info "Запуск микросервисов..."
    docker-compose -f docker-compose.microservices.yml up -d
    
    log "Все сервисы запущены ✅"
}

# Проверка здоровья сервисов
check_health() {
    log "Проверка здоровья сервисов..."
    
    services=("auth-service:3001" "message-service:3002" "notification-service:3003" "monitoring-service:3004")
    
    for service in "${services[@]}"; do
        service_name=$(echo $service | cut -d':' -f1)
        port=$(echo $service | cut -d':' -f2)
        
        info "Проверка $service_name..."
        
        max_attempts=30
        attempt=1
        
        while [ $attempt -le $max_attempts ]; do
            if curl -f -s "http://localhost:$port/health" > /dev/null; then
                log "$service_name здоров ✅"
                break
            else
                if [ $attempt -eq $max_attempts ]; then
                    error "$service_name не отвечает после $max_attempts попыток"
                    return 1
                fi
                info "Попытка $attempt/$max_attempts для $service_name..."
                sleep 5
                ((attempt++))
            fi
        done
    done
    
    log "Все сервисы здоровы ✅"
}

# Показать статус сервисов
show_status() {
    log "Статус сервисов:"
    docker-compose -f docker-compose.microservices.yml ps
    
    echo ""
    log "Доступные эндпоинты:"
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔐 Auth Service: http://localhost:3001"
    echo "💬 Message Service: http://localhost:3002"
    echo "🔔 Notification Service: http://localhost:3003"
    echo "📊 Monitoring Service: http://localhost:3004"
    echo "🗄️  PgAdmin: http://localhost:8080"
    echo "🔍 Nginx Gateway: http://localhost"
    
    echo ""
    log "Для просмотра логов используйте:"
    echo "docker-compose -f docker-compose.microservices.yml logs -f [service-name]"
    
    echo ""
    log "Для остановки сервисов используйте:"
    echo "./scripts/stop-microservices.sh"
}

# Основная функция
main() {
    log "🚀 Запуск микросервисной архитектуры мессенджера"
    
    check_dependencies
    create_env_file
    build_images
    start_services
    
    info "Ожидание готовности сервисов..."
    sleep 60
    
    check_health
    show_status
    
    log "🎉 Микросервисная архитектура успешно запущена!"
}

# Обработка сигналов
trap 'error "Прерывание выполнения"; exit 1' INT TERM

# Запуск основной функции
main "$@"
