#!/bin/bash

echo "=== Запуск ELK Stack ==="

# Устанавливаем vm.max_map_count для Elasticsearch
echo "Настройка vm.max_map_count для Elasticsearch..."
sudo sysctl -w vm.max_map_count=262144

# Запускаем ELK Stack
echo "Запуск ELK Stack..."
docker-compose up -d

echo "Ожидание запуска сервисов..."
sleep 30

# Проверяем статус сервисов
echo "Проверка статуса сервисов:"
docker-compose ps

echo ""
echo "✅ ELK Stack запущен!"
echo ""
echo "🔗 Доступные сервисы:"
echo "   Elasticsearch: http://localhost:9200"
echo "   Kibana:        http://localhost:5601"
echo "   Logstash:      http://localhost:9600"
echo ""
echo "📊 Настройка Kibana:"
echo "   1. Откройте http://localhost:5601"
echo "   2. Перейдите в Management > Stack Management > Index Patterns"
echo "   3. Создайте index pattern: messenger-logs-*"
echo "   4. Выберите @timestamp как time field"
echo "   5. Перейдите в Discover для просмотра логов"
