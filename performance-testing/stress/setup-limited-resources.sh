#!/bin/bash

# Скрипт для запуска Docker Compose с ограниченными ресурсами

# Переходим в корневую директорию проекта
cd "$(dirname "$0")/.."
ROOT_DIR="$(pwd)"

echo "====== Настройка ограниченной конфигурации ======"
echo "Рабочая директория: $ROOT_DIR"

# Проверяем, существует ли файл docker-compose-limited.yml
if [ ! -f "$ROOT_DIR/docker-compose-limited.yml" ]; then
  echo "Ошибка: Файл docker-compose-limited.yml не найден в директории $ROOT_DIR"
  exit 1
fi

# Останавливаем текущие контейнеры
echo "Останавливаем текущие контейнеры..."
docker-compose down

# Запускаем с ограниченной конфигурацией
echo "Запускаем контейнеры с ограниченными ресурсами..."
docker-compose -f "$ROOT_DIR/docker-compose-limited.yml" up -d

# Проверка запущенных контейнеров
echo "Проверка запущенных контейнеров..."
sleep 5
docker-compose -f "$ROOT_DIR/docker-compose-limited.yml" ps

echo "====== Конфигурация установлена ======"
echo "Контейнеры запущены с ограничениями ресурсов (25% от общего объема):"
echo "- Backend: 4 ядра CPU, 2GB RAM"
echo "- PostgreSQL: 1 ядро CPU, 1GB RAM"
echo "- Redis: 0.5 ядра CPU, 256MB RAM"
echo "Теперь вы можете запустить стресс-тест с помощью ./run-stress-test.sh" 