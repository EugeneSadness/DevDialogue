#!/bin/bash

# Скрипт для запуска стресс-теста и мониторинга ресурсов

# Переходим в директорию скрипта
cd "$(dirname "$0")"
SCRIPT_DIR="$(pwd)"

echo "====== Подготовка к стресс-тесту ======"
echo "Рабочая директория: $SCRIPT_DIR"

# Проверяем, работает ли Docker
if ! docker ps > /dev/null 2>&1; then
  echo "Ошибка: Docker не запущен. Запустите Docker и повторите попытку."
  exit 1
fi

# Проверяем, работают ли все необходимые контейнеры
REQUIRED_CONTAINERS=("backend" "postgres" "redis")
for container in "${REQUIRED_CONTAINERS[@]}"; do
  if ! docker ps | grep -q $container; then
    echo "Ошибка: Контейнер $container не запущен. Запустите docker-compose up и повторите попытку."
    exit 1
  fi
done

# Устанавливаем зависимости для стресс-теста
echo "Установка зависимостей..."
cp stress-test-package.json package.json
npm install

# Настройка параметров теста
echo "====== Настройка параметров ======"
echo "Текущие параметры в stress-test.js:"
echo "- Соединений на воркер: 100 (изменить в переменной connectionsPerWorker)"
echo "- Интервал отправки сообщений: 2000 мс (изменить в переменной messageInterval)"
echo "- Продолжительность теста: 120 секунд (изменить в переменной testDuration)"
echo "- Период нарастания нагрузки: 30 секунд (изменить в переменной rampUpPeriod)"
echo ""
echo "Вы можете изменить параметры, отредактировав файл stress-test.js"
echo "Нажмите ENTER для продолжения или Ctrl+C для отмены"
read

# Запуск мониторинга ресурсов в фоновом режиме
echo "====== Запуск мониторинга ресурсов ======"
node monitor-resources.js &
MONITOR_PID=$!
echo "Мониторинг запущен с PID: $MONITOR_PID"

# Запуск стресс-теста
echo "====== Запуск стресс-теста ======"
echo "Запуск теста через 5 секунд..."
sleep 5
node stress-test.js

# После завершения стресс-теста даем мониторингу еще 30 секунд для сбора данных
echo "Стресс-тест завершен. Ожидание завершения мониторинга..."
sleep 30

# Если мониторинг все еще работает, завершаем его
if ps -p $MONITOR_PID > /dev/null; then
  echo "Завершение процесса мониторинга..."
  kill $MONITOR_PID
fi

echo "====== Завершено ======"
echo "Результаты стресс-теста доступны в следующих файлах:"
echo "- $SCRIPT_DIR/stress-test-metrics.json - подробные метрики в формате JSON"
echo "- $SCRIPT_DIR/stress-test-metrics.csv - метрики в формате CSV для анализа"
echo ""

# Запуск анализа результатов
echo "====== Анализ результатов ======"
echo "Запуск анализа через 3 секунды..."
sleep 3
node analyze-results.js

echo ""
echo "Для визуализации результатов вы можете импортировать CSV в Excel или использовать Grafana" 