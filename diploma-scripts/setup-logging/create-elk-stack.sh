#!/bin/bash

# Скрипт для настройки ELK Stack (Elasticsearch, Logstash, Kibana)
# Основан на инструкциях из diploma/screenshots.md, раздел 2.6

set -e

echo "=== Настройка ELK Stack для логирования мессенджера ==="

# Проверяем, установлен ли Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен. Установите Docker Compose и повторите попытку."
    exit 1
fi

# Создаем директорию для ELK Stack
mkdir -p elk-stack
cd elk-stack

# Создаем docker-compose.yml для ELK Stack
echo "Создание docker-compose.yml для ELK Stack..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  elasticsearch:
    image: elasticsearch:7.17.9
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - xpack.security.enabled=false
      - xpack.monitoring.collection.enabled=true
    ports:
      - "9200:9200"
      - "9300:9300"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
      - ./elasticsearch/config/elasticsearch.yml:/usr/share/elasticsearch/config/elasticsearch.yml:ro
    networks:
      - elk-network
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9200/_cluster/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5

  logstash:
    image: logstash:7.17.9
    container_name: logstash
    ports:
      - "5044:5044"
      - "5000:5000/tcp"
      - "5000:5000/udp"
      - "9600:9600"
    volumes:
      - ./logstash/config/logstash.yml:/usr/share/logstash/config/logstash.yml:ro
      - ./logstash/pipeline:/usr/share/logstash/pipeline:ro
    environment:
      - "LS_JAVA_OPTS=-Xmx256m -Xms256m"
    networks:
      - elk-network
    depends_on:
      elasticsearch:
        condition: service_healthy

  kibana:
    image: kibana:7.17.9
    container_name: kibana
    ports:
      - "5601:5601"
    volumes:
      - ./kibana/config/kibana.yml:/usr/share/kibana/config/kibana.yml:ro
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    networks:
      - elk-network
    depends_on:
      elasticsearch:
        condition: service_healthy

  filebeat:
    image: elastic/filebeat:7.17.9
    container_name: filebeat
    user: root
    volumes:
      - ./filebeat/config/filebeat.yml:/usr/share/filebeat/filebeat.yml:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - filebeat_data:/usr/share/filebeat/data
    environment:
      - output.elasticsearch.hosts=["elasticsearch:9200"]
    networks:
      - elk-network
    depends_on:
      elasticsearch:
        condition: service_healthy

volumes:
  elasticsearch_data:
  filebeat_data:

networks:
  elk-network:
    driver: bridge
EOF

# Создаем конфигурацию Elasticsearch
echo "Создание конфигурации Elasticsearch..."
mkdir -p elasticsearch/config
cat > elasticsearch/config/elasticsearch.yml << 'EOF'
cluster.name: "messenger-elk-cluster"
network.host: 0.0.0.0

# Настройки для разработки (не для продакшн!)
xpack.security.enabled: false
xpack.monitoring.collection.enabled: true

# Настройки индексов
action.auto_create_index: true
action.destructive_requires_name: false
EOF

# Создаем конфигурацию Logstash
echo "Создание конфигурации Logstash..."
mkdir -p logstash/config logstash/pipeline

cat > logstash/config/logstash.yml << 'EOF'
http.host: "0.0.0.0"
xpack.monitoring.elasticsearch.hosts: [ "http://elasticsearch:9200" ]
path.config: /usr/share/logstash/pipeline
EOF

cat > logstash/pipeline/logstash.conf << 'EOF'
input {
  beats {
    port => 5044
  }
  
  tcp {
    port => 5000
    codec => json_lines
  }
  
  udp {
    port => 5000
    codec => json_lines
  }
}

filter {
  # Парсинг логов мессенджера
  if [fields][service] == "messenger" {
    grok {
      match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} \[%{LOGLEVEL:level}\] %{GREEDYDATA:log_message}" }
    }
    
    date {
      match => [ "timestamp", "ISO8601" ]
    }
    
    # Добавляем метаданные
    mutate {
      add_field => { "service" => "messenger-api" }
      add_field => { "environment" => "development" }
    }
  }
  
  # Парсинг Docker логов
  if [container][name] {
    mutate {
      add_field => { "container_name" => "%{[container][name]}" }
    }
  }
  
  # Обогащение данных
  if [level] == "ERROR" or [level] == "error" {
    mutate {
      add_tag => [ "error" ]
      add_field => { "alert_level" => "high" }
    }
  }
  
  if [level] == "WARN" or [level] == "warn" {
    mutate {
      add_tag => [ "warning" ]
      add_field => { "alert_level" => "medium" }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "messenger-logs-%{+YYYY.MM.dd}"
    template_name => "messenger-template"
    template_pattern => "messenger-logs-*"
    template => {
      "index_patterns" => ["messenger-logs-*"]
      "settings" => {
        "number_of_shards" => 1
        "number_of_replicas" => 0
      }
      "mappings" => {
        "properties" => {
          "@timestamp" => { "type" => "date" }
          "level" => { "type" => "keyword" }
          "service" => { "type" => "keyword" }
          "environment" => { "type" => "keyword" }
          "container_name" => { "type" => "keyword" }
          "message" => { "type" => "text" }
          "log_message" => { "type" => "text" }
        }
      }
    }
  }
  
  # Дублируем в stdout для отладки
  stdout {
    codec => rubydebug
  }
}
EOF

# Создаем конфигурацию Kibana
echo "Создание конфигурации Kibana..."
mkdir -p kibana/config
cat > kibana/config/kibana.yml << 'EOF'
server.name: kibana
server.host: 0.0.0.0
elasticsearch.hosts: [ "http://elasticsearch:9200" ]
monitoring.ui.container.elasticsearch.enabled: true

# Настройки для разработки
server.publicBaseUrl: "http://localhost:5601"
xpack.security.enabled: false
xpack.encryptedSavedObjects.encryptionKey: "something_at_least_32_characters_long"
EOF

# Создаем конфигурацию Filebeat
echo "Создание конфигурации Filebeat..."
mkdir -p filebeat/config
cat > filebeat/config/filebeat.yml << 'EOF'
filebeat.inputs:
- type: container
  paths:
    - '/var/lib/docker/containers/*/*.log'
  processors:
  - add_docker_metadata:
      host: "unix:///var/run/docker.sock"
  - decode_json_fields:
      fields: ["message"]
      target: ""
      overwrite_keys: true

- type: log
  enabled: true
  paths:
    - /var/log/messenger/*.log
  fields:
    service: messenger
  fields_under_root: true

output.logstash:
  hosts: ["logstash:5044"]

processors:
- add_host_metadata:
    when.not.contains.tags: forwarded

logging.level: info
logging.to_files: true
logging.files:
  path: /var/log/filebeat
  name: filebeat
  keepfiles: 7
  permissions: 0644
EOF

# Создаем скрипт для запуска ELK Stack
echo "Создание скрипта запуска..."
cat > start-elk.sh << 'EOF'
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
EOF

chmod +x start-elk.sh

# Создаем скрипт для остановки
cat > stop-elk.sh << 'EOF'
#!/bin/bash

echo "=== Остановка ELK Stack ==="
docker-compose down

echo "Удаление volumes (опционально):"
echo "docker-compose down -v"
EOF

chmod +x stop-elk.sh

# Создаем скрипт для отправки тестовых логов
cat > send-test-logs.sh << 'EOF'
#!/bin/bash

echo "=== Отправка тестовых логов ==="

# Отправляем тестовые логи через TCP
for i in {1..10}; do
  echo "{\"timestamp\":\"$(date -Iseconds)\",\"level\":\"INFO\",\"service\":\"messenger-api\",\"message\":\"Test log message $i\"}" | nc localhost 5000
  sleep 1
done

echo "Отправлено 10 тестовых логов"
echo "Проверьте их в Kibana: http://localhost:5601"
EOF

chmod +x send-test-logs.sh

echo "✅ ELK Stack конфигурация создана в директории elk-stack/"
echo ""
echo "Созданные файлы:"
find . -type f -name "*.yml" -o -name "*.conf" -o -name "*.sh" | sort

echo ""
echo "Для запуска ELK Stack выполните:"
echo "cd elk-stack && ./start-elk.sh"
echo ""
echo "Для отправки тестовых логов:"
echo "cd elk-stack && ./send-test-logs.sh"
