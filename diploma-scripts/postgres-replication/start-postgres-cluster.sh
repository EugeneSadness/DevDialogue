#!/bin/bash

echo "=== Запуск PostgreSQL кластера с репликацией ==="

# Запускаем кластер
docker-compose up -d postgres-master

echo "Ожидание запуска master..."
sleep 15

# Запускаем slave
docker-compose up -d postgres-slave

echo "Ожидание настройки репликации..."
sleep 10

# Запускаем pgAdmin
docker-compose up -d pgadmin

echo "Проверка статуса кластера:"
docker-compose ps

echo ""
echo "✅ PostgreSQL кластер запущен!"
echo ""
echo "🔗 Подключения:"
echo "   Master:  localhost:5432"
echo "   Slave:   localhost:5433"
echo "   pgAdmin: http://localhost:8080 (admin@messenger.local / admin_password)"
echo ""
echo "📊 Проверка репликации:"
echo "   docker exec postgres-master psql -U postgres -c \"SELECT * FROM pg_stat_replication;\""
