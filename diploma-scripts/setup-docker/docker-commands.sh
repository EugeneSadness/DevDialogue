#!/bin/bash

# Основные Docker команды для работы с мессенджером
# Основан на инструкциях из diploma/screenshots.md

set -e

echo "=== Основные Docker команды для проекта мессенджера ==="

# Функция для отображения помощи
show_help() {
    echo "Использование: $0 [КОМАНДА]"
    echo ""
    echo "Доступные команды:"
    echo "  build     - Собрать образ мессенджера"
    echo "  run       - Запустить контейнер мессенджера"
    echo "  stop      - Остановить контейнер мессенджера"
    echo "  logs      - Показать логи контейнера"
    echo "  images    - Показать список Docker образов"
    echo "  ps        - Показать запущенные контейнеры"
    echo "  clean     - Очистить неиспользуемые образы и контейнеры"
    echo "  help      - Показать эту справку"
    echo ""
}

# Функция для сборки образа
build_image() {
    echo "🔨 Сборка Docker образа мессенджера..."
    
    if [ ! -f "messenger-service/Dockerfile" ]; then
        echo "❌ Dockerfile не найден. Сначала запустите create-dockerfile.sh"
        exit 1
    fi
    
    cd messenger-service
    docker build -t messenger-service:latest .
    docker build -t messenger-service:v1.0.0 .
    
    echo "✅ Образ успешно собран!"
    echo "Созданные образы:"
    docker images | grep messenger-service
}

# Функция для запуска контейнера
run_container() {
    echo "🚀 Запуск контейнера мессенджера..."
    
    # Останавливаем существующий контейнер, если он запущен
    docker stop messenger-app 2>/dev/null || true
    docker rm messenger-app 2>/dev/null || true
    
    # Запускаем новый контейнер
    docker run -d \
        --name messenger-app \
        -p 3000:3000 \
        -e NODE_ENV=production \
        messenger-service:latest
    
    echo "✅ Контейнер запущен!"
    echo "🔗 Приложение доступно по адресу: http://localhost:3000"
    
    # Показываем статус
    sleep 2
    docker ps --filter "name=messenger-app"
}

# Функция для остановки контейнера
stop_container() {
    echo "🛑 Остановка контейнера мессенджера..."
    docker stop messenger-app 2>/dev/null || echo "Контейнер не запущен"
    docker rm messenger-app 2>/dev/null || echo "Контейнер не найден"
    echo "✅ Контейнер остановлен"
}

# Функция для показа логов
show_logs() {
    echo "📋 Логи контейнера мессенджера:"
    echo "================================"
    docker logs messenger-app --tail 50 -f
}

# Функция для показа образов
show_images() {
    echo "📦 Docker образы:"
    echo "=================="
    docker images
}

# Функция для показа контейнеров
show_containers() {
    echo "🐳 Запущенные контейнеры:"
    echo "=========================="
    docker ps -a
}

# Функция для очистки
clean_docker() {
    echo "🧹 Очистка Docker..."
    
    echo "Удаление остановленных контейнеров..."
    docker container prune -f
    
    echo "Удаление неиспользуемых образов..."
    docker image prune -f
    
    echo "Удаление неиспользуемых сетей..."
    docker network prune -f
    
    echo "Удаление неиспользуемых томов..."
    docker volume prune -f
    
    echo "✅ Очистка завершена"
}

# Обработка аргументов командной строки
case "${1:-help}" in
    build)
        build_image
        ;;
    run)
        run_container
        ;;
    stop)
        stop_container
        ;;
    logs)
        show_logs
        ;;
    images)
        show_images
        ;;
    ps)
        show_containers
        ;;
    clean)
        clean_docker
        ;;
    help|*)
        show_help
        ;;
esac
