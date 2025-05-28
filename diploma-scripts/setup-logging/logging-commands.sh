#!/bin/bash

# Команды для управления системой логирования ELK Stack
# Основан на инструкциях из diploma/screenshots.md

set -e

echo "=== Команды управления логированием ELK Stack ==="

# Функция для отображения помощи
show_help() {
    echo "Использование: $0 [КОМАНДА]"
    echo ""
    echo "Доступные команды:"
    echo "  start     - Запустить ELK Stack"
    echo "  stop      - Остановить ELK Stack"
    echo "  restart   - Перезапустить ELK Stack"
    echo "  logs      - Показать логи сервисов"
    echo "  status    - Показать статус сервисов"
    echo "  test      - Отправить тестовые логи"
    echo "  clean     - Очистить логи и данные"
    echo "  backup    - Создать резервную копию логов"
    echo "  help      - Показать эту справку"
    echo ""
}

# Функция для запуска ELK Stack
start_elk() {
    echo "🚀 Запуск ELK Stack..."
    
    if [ ! -f "elk-stack/docker-compose.yml" ]; then
        echo "❌ ELK Stack не настроен. Сначала запустите create-elk-stack.sh"
        exit 1
    fi
    
    cd elk-stack
    
    # Устанавливаем vm.max_map_count для Elasticsearch
    echo "Настройка vm.max_map_count для Elasticsearch..."
    sudo sysctl -w vm.max_map_count=262144 2>/dev/null || echo "Не удалось установить vm.max_map_count (требуются права sudo)"
    
    # Запускаем сервисы
    docker-compose up -d
    
    echo "Ожидание запуска сервисов..."
    sleep 30
    
    # Проверяем статус
    docker-compose ps
    
    cd ..
    echo "✅ ELK Stack запущен!"
}

# Функция для остановки ELK Stack
stop_elk() {
    echo "🛑 Остановка ELK Stack..."
    
    if [ -f "elk-stack/docker-compose.yml" ]; then
        cd elk-stack
        docker-compose down
        cd ..
        echo "✅ ELK Stack остановлен"
    else
        echo "❌ ELK Stack не найден"
    fi
}

# Функция для перезапуска ELK Stack
restart_elk() {
    echo "🔄 Перезапуск ELK Stack..."
    stop_elk
    sleep 5
    start_elk
}

# Функция для показа логов
show_logs() {
    echo "📋 Логи ELK Stack сервисов:"
    echo "=========================="
    
    if [ -f "elk-stack/docker-compose.yml" ]; then
        cd elk-stack
        
        echo "Выберите сервис для просмотра логов:"
        echo "1) Elasticsearch"
        echo "2) Logstash"
        echo "3) Kibana"
        echo "4) Filebeat"
        echo "5) Все сервисы"
        
        read -p "Введите номер (1-5): " choice
        
        case $choice in
            1)
                docker-compose logs -f elasticsearch
                ;;
            2)
                docker-compose logs -f logstash
                ;;
            3)
                docker-compose logs -f kibana
                ;;
            4)
                docker-compose logs -f filebeat
                ;;
            5)
                docker-compose logs -f
                ;;
            *)
                echo "Неверный выбор"
                ;;
        esac
        
        cd ..
    else
        echo "❌ ELK Stack не найден"
    fi
}

# Функция для показа статуса
show_status() {
    echo "📊 Статус ELK Stack:"
    echo "==================="
    
    if [ -f "elk-stack/docker-compose.yml" ]; then
        cd elk-stack
        docker-compose ps
        cd ..
        
        echo ""
        echo "🔗 Доступные сервисы:"
        
        # Проверяем доступность Elasticsearch
        if curl -s http://localhost:9200/_cluster/health &>/dev/null; then
            echo "✅ Elasticsearch: http://localhost:9200"
        else
            echo "❌ Elasticsearch: недоступен"
        fi
        
        # Проверяем доступность Kibana
        if curl -s http://localhost:5601/api/status &>/dev/null; then
            echo "✅ Kibana: http://localhost:5601"
        else
            echo "❌ Kibana: недоступен"
        fi
        
        # Проверяем доступность Logstash
        if curl -s http://localhost:9600 &>/dev/null; then
            echo "✅ Logstash: http://localhost:9600"
        else
            echo "❌ Logstash: недоступен"
        fi
        
    else
        echo "❌ ELK Stack не настроен"
    fi
}

# Функция для отправки тестовых логов
send_test_logs() {
    echo "📤 Отправка тестовых логов..."
    
    # Проверяем, что Logstash доступен
    if ! curl -s http://localhost:5000 &>/dev/null; then
        echo "❌ Logstash недоступен на порту 5000"
        exit 1
    fi
    
    # Отправляем различные типы логов
    echo "Отправка INFO логов..."
    for i in {1..5}; do
        echo "{\"timestamp\":\"$(date -Iseconds)\",\"level\":\"INFO\",\"service\":\"messenger-api\",\"message\":\"User login successful\",\"user_id\":\"user_$i\"}" | nc localhost 5000
        sleep 1
    done
    
    echo "Отправка WARNING логов..."
    for i in {1..3}; do
        echo "{\"timestamp\":\"$(date -Iseconds)\",\"level\":\"WARN\",\"service\":\"messenger-api\",\"message\":\"High memory usage detected\",\"memory_usage\":\"85%\"}" | nc localhost 5000
        sleep 1
    done
    
    echo "Отправка ERROR логов..."
    for i in {1..2}; do
        echo "{\"timestamp\":\"$(date -Iseconds)\",\"level\":\"ERROR\",\"service\":\"messenger-api\",\"message\":\"Database connection failed\",\"error\":\"Connection timeout\"}" | nc localhost 5000
        sleep 1
    done
    
    echo "✅ Отправлено 10 тестовых логов"
    echo "🔗 Проверьте их в Kibana: http://localhost:5601"
}

# Функция для очистки данных
clean_data() {
    echo "🧹 Очистка данных ELK Stack..."
    
    read -p "Вы уверены, что хотите удалить все логи и данные? (y/N): " CONFIRM
    
    if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
        echo "Операция отменена"
        exit 0
    fi
    
    if [ -f "elk-stack/docker-compose.yml" ]; then
        cd elk-stack
        
        # Останавливаем сервисы
        docker-compose down
        
        # Удаляем volumes
        docker-compose down -v
        
        # Удаляем данные Elasticsearch
        curl -X DELETE "localhost:9200/*" 2>/dev/null || echo "Elasticsearch недоступен"
        
        cd ..
        echo "✅ Данные очищены"
    else
        echo "❌ ELK Stack не найден"
    fi
}

# Функция для создания резервной копии
backup_logs() {
    echo "💾 Создание резервной копии логов..."
    
    BACKUP_DIR="elk-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Экспортируем индексы Elasticsearch
    if curl -s http://localhost:9200/_cat/indices &>/dev/null; then
        echo "Экспорт индексов Elasticsearch..."
        
        # Получаем список индексов
        INDICES=$(curl -s "http://localhost:9200/_cat/indices?h=index" | grep -v "^\." | head -10)
        
        for index in $INDICES; do
            echo "Экспорт индекса: $index"
            curl -s "http://localhost:9200/$index/_search?size=1000" > "$BACKUP_DIR/$index.json"
        done
        
        echo "✅ Резервная копия создана в директории: $BACKUP_DIR"
    else
        echo "❌ Elasticsearch недоступен"
    fi
}

# Функция для настройки Kibana дашбордов
setup_kibana_dashboards() {
    echo "📊 Настройка Kibana дашбордов..."
    
    # Ждем готовности Kibana
    echo "Ожидание готовности Kibana..."
    until curl -s http://localhost:5601/api/status &>/dev/null; do
        echo "Kibana еще не готов, ждем..."
        sleep 5
    done
    
    # Создаем index pattern
    echo "Создание index pattern..."
    curl -X POST "http://localhost:5601/api/saved_objects/index-pattern/messenger-logs" \
        -H "Content-Type: application/json" \
        -H "kbn-xsrf: true" \
        -d '{
            "attributes": {
                "title": "messenger-logs-*",
                "timeFieldName": "@timestamp"
            }
        }' 2>/dev/null || echo "Index pattern уже существует"
    
    echo "✅ Kibana дашборды настроены"
    echo "🔗 Откройте Kibana: http://localhost:5601"
}

# Обработка аргументов командной строки
case "${1:-help}" in
    start)
        start_elk
        ;;
    stop)
        stop_elk
        ;;
    restart)
        restart_elk
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    test)
        send_test_logs
        ;;
    clean)
        clean_data
        ;;
    backup)
        backup_logs
        ;;
    dashboards)
        setup_kibana_dashboards
        ;;
    help|*)
        show_help
        ;;
esac
