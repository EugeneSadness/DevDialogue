#!/bin/bash

# Скрипт для запуска Grafana и Prometheus для мониторинга
# Основан на инструкциях из diploma/screenshots.md, раздел 2.5

set -e

echo "=== Запуск системы мониторинга (Grafana + Prometheus) ==="

# Проверяем, установлен ли Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Установите Docker и повторите попытку."
    exit 1
fi

# Создаем сеть для мониторинга
echo "Создание Docker сети для мониторинга..."
docker network create monitoring-network 2>/dev/null || echo "Сеть monitoring-network уже существует"

# Создаем директории для данных
mkdir -p monitoring-data/prometheus
mkdir -p monitoring-data/grafana

# Создаем конфигурацию Prometheus
echo "Создание конфигурации Prometheus..."
cat > monitoring-data/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'messenger-api'
    static_configs:
      - targets: ['host.docker.internal:3000']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
EOF

echo "Запуск Prometheus..."
docker run -d \
  --name prometheus \
  --network monitoring-network \
  -p 9090:9090 \
  -v "$(pwd)/monitoring-data/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml" \
  -v "$(pwd)/monitoring-data/prometheus:/prometheus" \
  prom/prometheus:latest \
  --config.file=/etc/prometheus/prometheus.yml \
  --storage.tsdb.path=/prometheus \
  --web.console.libraries=/etc/prometheus/console_libraries \
  --web.console.templates=/etc/prometheus/consoles \
  --storage.tsdb.retention.time=200h \
  --web.enable-lifecycle

echo "Запуск Node Exporter для системных метрик..."
docker run -d \
  --name node-exporter \
  --network monitoring-network \
  -p 9100:9100 \
  prom/node-exporter:latest

echo "Запуск Grafana..."
docker run -d \
  --name grafana \
  --network monitoring-network \
  -p 3000:3000 \
  -v "$(pwd)/monitoring-data/grafana:/var/lib/grafana" \
  -e "GF_SECURITY_ADMIN_PASSWORD=admin123" \
  grafana/grafana:latest

# Ждем запуска сервисов
echo "Ожидание запуска сервисов..."
sleep 10

# Проверяем статус контейнеров
echo ""
echo "Статус контейнеров мониторинга:"
echo "================================"
docker ps --filter "name=prometheus" --filter "name=grafana" --filter "name=node-exporter" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "✅ Система мониторинга запущена!"
echo ""
echo "🔗 Доступные сервисы:"
echo "   Prometheus: http://localhost:9090"
echo "   Grafana:    http://localhost:3000 (admin/admin123)"
echo "   Node Exporter: http://localhost:9100"
echo ""
echo "📊 Настройка Grafana:"
echo "   1. Откройте http://localhost:3000"
echo "   2. Войдите с логином: admin, паролем: admin123"
echo "   3. Добавьте источник данных Prometheus: http://prometheus:9090"
echo "   4. Импортируйте готовые дашборды или создайте свои"
echo ""
echo "🛑 Для остановки выполните:"
echo "   docker stop prometheus grafana node-exporter"
echo "   docker rm prometheus grafana node-exporter"
echo "   docker network rm monitoring-network"
