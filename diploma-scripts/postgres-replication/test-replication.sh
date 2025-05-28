#!/bin/bash

echo "=== Тестирование PostgreSQL репликации ==="

# Создаем тестовую таблицу на master
echo "Создание тестовой таблицы на master..."
docker exec postgres-master psql -U postgres -d messenger -c "
CREATE TABLE IF NOT EXISTS replication_test (
    id SERIAL PRIMARY KEY,
    test_data VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"

# Вставляем тестовые данные на master
echo "Вставка тестовых данных на master..."
docker exec postgres-master psql -U postgres -d messenger -c "
INSERT INTO replication_test (test_data) VALUES 
('Test data 1'),
('Test data 2'),
('Test data 3');
"

# Ждем репликации
echo "Ожидание репликации..."
sleep 5

# Проверяем данные на slave
echo "Проверка данных на slave..."
docker exec postgres-slave psql -U postgres -d messenger -c "
SELECT * FROM replication_test;
"

# Проверяем статус репликации
echo ""
echo "Статус репликации на master:"
docker exec postgres-master psql -U postgres -c "
SELECT client_addr, state, sync_state FROM pg_stat_replication;
"

echo ""
echo "Статус репликации на slave:"
docker exec postgres-slave psql -U postgres -c "
SELECT status, receive_start_lsn, received_lsn FROM pg_stat_wal_receiver;
"
