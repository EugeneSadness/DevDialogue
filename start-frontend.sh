#!/bin/bash

echo "🚀 Запуск фронтенда мессенджера в Docker"
echo "========================================"

# Проверяем, что Docker запущен
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker не запущен. Пожалуйста, запустите Docker и попробуйте снова."
    exit 1
fi

# Останавливаем предыдущие контейнеры если они есть
echo "🛑 Остановка предыдущих контейнеров..."
docker-compose -f docker-compose.frontend.yml down

# Собираем и запускаем контейнеры
echo "🔨 Сборка и запуск контейнеров..."
docker-compose -f docker-compose.frontend.yml up --build -d

# Ждем запуска
echo "⏳ Ожидание запуска сервисов..."
sleep 10

# Проверяем статус
echo "📊 Статус контейнеров:"
docker-compose -f docker-compose.frontend.yml ps

echo ""
echo "✅ Фронтенд запущен!"
echo "🌐 Откройте в браузере: http://localhost:4000"
echo "📱 React Dev Server: http://localhost:3000"
echo ""
echo "📝 Полезные команды:"
echo "  Логи фронтенда: docker-compose -f docker-compose.frontend.yml logs frontend"
echo "  Логи nginx: docker-compose -f docker-compose.frontend.yml logs nginx-proxy"
echo "  Остановить: docker-compose -f docker-compose.frontend.yml down"
echo "  Перезапустить: docker-compose -f docker-compose.frontend.yml restart"
