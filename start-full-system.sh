#!/bin/bash

echo "🚀 Запуск полной системы мессенджера"
echo "===================================="

# Проверяем, что Docker запущен
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker не запущен. Пожалуйста, запустите Docker и попробуйте снова."
    exit 1
fi

# Останавливаем предыдущие контейнеры если они есть
echo "🛑 Остановка предыдущих контейнеров..."
docker-compose down -v

# Очищаем старые образы (опционально)
echo "🧹 Очистка старых образов..."
docker system prune -f

# Собираем и запускаем всю систему
echo "🔨 Сборка и запуск всей системы..."
echo "   📦 База данных PostgreSQL"
echo "   🔐 Auth Service"
echo "   💬 Message Service"
echo "   🔔 Notification Service"
echo "   📊 Monitoring Service"
echo "   🌐 Frontend React App"
echo "   🔄 Nginx Reverse Proxy"

docker-compose up --build -d

# Ждем запуска
echo "⏳ Ожидание запуска всех сервисов..."
echo "   Это может занять несколько минут при первом запуске..."

# Ждем 30 секунд для инициализации БД
sleep 30

# Проверяем статус сервисов
echo "📊 Проверка статуса сервисов:"
docker-compose ps

echo ""
echo "🔍 Проверка здоровья сервисов..."

# Функция для проверки здоровья сервиса
check_health() {
    local service_name=$1
    local url=$2
    local max_attempts=10
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            echo "✅ $service_name: Работает"
            return 0
        else
            echo "⏳ $service_name: Ожидание... (попытка $attempt/$max_attempts)"
            sleep 5
            ((attempt++))
        fi
    done
    
    echo "❌ $service_name: Не отвечает"
    return 1
}

# Проверяем каждый сервис
check_health "Auth Service" "http://localhost:3001/health"
check_health "Message Service" "http://localhost:3002/health"
check_health "Notification Service" "http://localhost:3003/health"
check_health "Monitoring Service" "http://localhost:3004/health"
check_health "Frontend" "http://localhost:3000"
check_health "Nginx Proxy" "http://localhost:4000/nginx-health"

echo ""
echo "🎉 Система запущена!"
echo "==================="
echo "🌐 Главный URL: http://localhost:4000"
echo "📱 React Dev Server: http://localhost:3000"
echo ""
echo "🔗 API Endpoints:"
echo "  🔐 Auth: http://localhost:4000/api/auth/"
echo "  💬 Messages: http://localhost:4000/api/messages/"
echo "  🔔 Notifications: http://localhost:4000/api/notifications/"
echo "  📊 Health: http://localhost:4000/api/health/"
echo ""
echo "🗄️ База данных PostgreSQL:"
echo "  Host: localhost:5432"
echo "  Database: messenger"
echo "  User: messenger_user"
echo "  Password: messenger_pass"
echo ""
echo "📝 Полезные команды:"
echo "  Логи всех сервисов: docker-compose logs -f"
echo "  Логи конкретного сервиса: docker-compose logs -f [service-name]"
echo "  Остановить систему: docker-compose down"
echo "  Перезапустить: docker-compose restart"
echo "  Статус: docker-compose ps"
