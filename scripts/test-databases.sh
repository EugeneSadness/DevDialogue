#!/bin/bash

# Скрипт для тестирования баз данных микросервисов
# Автор: Дипломный проект
# Версия: 1.0

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для логирования
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Конфигурация подключения к БД
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="postgres"
DB_PASS="postgres_password"

# Функция для выполнения SQL запроса
execute_sql() {
    local database=$1
    local query=$2
    local description=$3
    
    info "Тестирование: $description"
    
    if PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $database -c "$query" > /dev/null 2>&1; then
        log "✅ $description - УСПЕШНО"
        return 0
    else
        error "❌ $description - ОШИБКА"
        return 1
    fi
}

# Проверка подключения к PostgreSQL
check_postgres_connection() {
    log "Проверка подключения к PostgreSQL..."
    
    if PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT version();" > /dev/null 2>&1; then
        log "✅ Подключение к PostgreSQL установлено"
    else
        error "❌ Не удается подключиться к PostgreSQL"
        exit 1
    fi
}

# Проверка существования баз данных
check_databases_exist() {
    log "Проверка существования баз данных микросервисов..."
    
    databases=("auth_db" "message_db" "notification_db" "monitoring_db")
    
    for db in "${databases[@]}"; do
        if PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -lqt | cut -d \| -f 1 | grep -qw $db; then
            log "✅ База данных $db существует"
        else
            error "❌ База данных $db не найдена"
            return 1
        fi
    done
}

# Проверка пользователей баз данных
check_database_users() {
    log "Проверка пользователей баз данных..."
    
    users=("auth_user" "message_user" "notification_user" "monitoring_user")
    
    for user in "${users[@]}"; do
        if PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT 1 FROM pg_user WHERE usename='$user';" | grep -q "1 row"; then
            log "✅ Пользователь $user существует"
        else
            error "❌ Пользователь $user не найден"
            return 1
        fi
    done
}

# Тестирование auth_db
test_auth_db() {
    log "Тестирование базы данных auth_db..."
    
    # Проверка таблиц
    execute_sql "auth_db" "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('users', 'user_sessions', 'refresh_tokens');" "Проверка таблиц auth_db"
    
    # Тестовые данные
    execute_sql "auth_db" "INSERT INTO users (username, email, password_hash, first_name, last_name) VALUES ('testuser', 'test@example.com', 'hashed_password', 'Test', 'User') ON CONFLICT (email) DO NOTHING;" "Вставка тестового пользователя"
    
    execute_sql "auth_db" "SELECT COUNT(*) FROM users WHERE email = 'test@example.com';" "Проверка тестового пользователя"
    
    # Очистка тестовых данных
    execute_sql "auth_db" "DELETE FROM users WHERE email = 'test@example.com';" "Очистка тестовых данных"
}

# Тестирование message_db
test_message_db() {
    log "Тестирование базы данных message_db..."
    
    # Проверка таблиц
    execute_sql "message_db" "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('chats', 'chat_members', 'messages', 'files', 'message_files');" "Проверка таблиц message_db"
    
    # Тестовые данные
    execute_sql "message_db" "INSERT INTO chats (name, description, created_by) VALUES ('Test Chat', 'Test Description', 1) ON CONFLICT DO NOTHING;" "Вставка тестового чата"
    
    execute_sql "message_db" "SELECT COUNT(*) FROM chats WHERE name = 'Test Chat';" "Проверка тестового чата"
    
    # Очистка тестовых данных
    execute_sql "message_db" "DELETE FROM chats WHERE name = 'Test Chat';" "Очистка тестовых данных"
}

# Тестирование notification_db
test_notification_db() {
    log "Тестирование базы данных notification_db..."
    
    # Проверка таблиц
    execute_sql "notification_db" "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('push_subscriptions', 'notifications', 'notification_settings', 'notification_templates');" "Проверка таблиц notification_db"
    
    # Проверка шаблонов уведомлений
    execute_sql "notification_db" "SELECT COUNT(*) FROM notification_templates;" "Проверка шаблонов уведомлений"
    
    # Тестовые данные
    execute_sql "notification_db" "INSERT INTO notification_settings (user_id, push_enabled, email_enabled) VALUES (999, true, true) ON CONFLICT (user_id) DO NOTHING;" "Вставка тестовых настроек"
    
    execute_sql "notification_db" "SELECT COUNT(*) FROM notification_settings WHERE user_id = 999;" "Проверка тестовых настроек"
    
    # Очистка тестовых данных
    execute_sql "notification_db" "DELETE FROM notification_settings WHERE user_id = 999;" "Очистка тестовых данных"
}

# Тестирование monitoring_db
test_monitoring_db() {
    log "Тестирование базы данных monitoring_db..."
    
    # Проверка таблиц
    execute_sql "monitoring_db" "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('service_metrics', 'health_checks', 'system_logs', 'alerts', 'monitoring_config', 'uptime_stats');" "Проверка таблиц monitoring_db"
    
    # Проверка конфигурации мониторинга
    execute_sql "monitoring_db" "SELECT COUNT(*) FROM monitoring_config;" "Проверка конфигурации мониторинга"
    
    # Тестовые данные
    execute_sql "monitoring_db" "INSERT INTO service_metrics (service_name, metric_name, metric_value, metric_type) VALUES ('test-service', 'test_metric', 100.0, 'gauge');" "Вставка тестовой метрики"
    
    execute_sql "monitoring_db" "SELECT COUNT(*) FROM service_metrics WHERE service_name = 'test-service';" "Проверка тестовой метрики"
    
    # Очистка тестовых данных
    execute_sql "monitoring_db" "DELETE FROM service_metrics WHERE service_name = 'test-service';" "Очистка тестовых данных"
}

# Тестирование репликации
test_replication() {
    log "Тестирование репликации PostgreSQL..."
    
    # Проверка статуса репликации на master
    if PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT client_addr, state FROM pg_stat_replication;" | grep -q "streaming"; then
        log "✅ Репликация активна"
    else
        warn "⚠️ Репликация не активна или slave не подключен"
    fi
    
    # Проверка подключения к slave
    if PGPASSWORD=$DB_PASS psql -h $DB_HOST -p 5433 -U $DB_USER -d postgres -c "SELECT pg_is_in_recovery();" | grep -q "t"; then
        log "✅ Slave сервер работает в режиме восстановления"
    else
        warn "⚠️ Slave сервер не найден или не в режиме восстановления"
    fi
}

# Показать статистику баз данных
show_database_stats() {
    log "Статистика баз данных:"
    
    databases=("auth_db" "message_db" "notification_db" "monitoring_db")
    
    for db in "${databases[@]}"; do
        info "База данных: $db"
        PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $db -c "
        SELECT 
            schemaname,
            tablename,
            n_tup_ins as inserts,
            n_tup_upd as updates,
            n_tup_del as deletes
        FROM pg_stat_user_tables 
        ORDER BY tablename;
        " 2>/dev/null || warn "Не удалось получить статистику для $db"
        echo ""
    done
}

# Основная функция
main() {
    log "🧪 Тестирование баз данных микросервисов"
    
    check_postgres_connection
    check_databases_exist
    check_database_users
    
    test_auth_db
    test_message_db
    test_notification_db
    test_monitoring_db
    
    test_replication
    show_database_stats
    
    log "🎉 Тестирование баз данных завершено успешно!"
}

# Обработка сигналов
trap 'error "Прерывание выполнения"; exit 1' INT TERM

# Запуск основной функции
main "$@"
