#!/bin/bash

# Скрипт для настройки PostgreSQL репликации (Master-Slave)
# Основан на инструкциях из diploma/screenshots.md, раздел 2.8

set -e

echo "=== Настройка PostgreSQL репликации для мессенджера ==="

# Создаем директорию для PostgreSQL
mkdir -p postgres-replication
cd postgres-replication

# Создаем конфигурацию Master PostgreSQL
echo "Создание конфигурации Master PostgreSQL..."
mkdir -p master/config slave/config

cat > master/config/postgresql.conf << 'EOF'
# PostgreSQL Master Configuration для мессенджера

# Основные настройки
listen_addresses = '*'
port = 5432
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# Настройки WAL для репликации
wal_level = replica
max_wal_senders = 3
max_replication_slots = 3
wal_keep_size = 128MB
wal_sender_timeout = 60s

# Настройки архивирования
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/archive/%f'
archive_timeout = 300

# Настройки логирования
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_statement = 'mod'
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '

# Настройки производительности
checkpoint_completion_target = 0.9
wal_buffers = 16MB
random_page_cost = 1.1
effective_io_concurrency = 200

# Настройки безопасности
ssl = off
password_encryption = md5
EOF

cat > master/config/pg_hba.conf << 'EOF'
# PostgreSQL Master HBA Configuration

# TYPE  DATABASE        USER            ADDRESS                 METHOD

# "local" is for Unix domain socket connections only
local   all             all                                     trust

# IPv4 local connections:
host    all             all             127.0.0.1/32            md5
host    all             all             0.0.0.0/0               md5

# Репликация
host    replication     replica         0.0.0.0/0               md5

# Подключения для мессенджера
host    messenger       messenger_user  0.0.0.0/0               md5
host    messenger_test  messenger_user  0.0.0.0/0               md5
EOF

# Создаем конфигурацию Slave PostgreSQL
echo "Создание конфигурации Slave PostgreSQL..."
cat > slave/config/postgresql.conf << 'EOF'
# PostgreSQL Slave Configuration для мессенджера

# Основные настройки (наследуются от master)
listen_addresses = '*'
port = 5432
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# Настройки для slave
hot_standby = on
max_standby_streaming_delay = 30s
max_standby_archive_delay = 30s
wal_receiver_status_interval = 10s
hot_standby_feedback = on

# Настройки логирования
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-slave-%Y-%m-%d_%H%M%S.log'
log_statement = 'mod'
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '

# Настройки производительности
checkpoint_completion_target = 0.9
wal_buffers = 16MB
random_page_cost = 1.1
effective_io_concurrency = 200
EOF

cat > slave/config/pg_hba.conf << 'EOF'
# PostgreSQL Slave HBA Configuration

# TYPE  DATABASE        USER            ADDRESS                 METHOD

# "local" is for Unix domain socket connections only
local   all             all                                     trust

# IPv4 local connections:
host    all             all             127.0.0.1/32            md5
host    all             all             0.0.0.0/0               md5

# Подключения для мессенджера (только чтение)
host    messenger       messenger_user  0.0.0.0/0               md5
host    messenger_test  messenger_user  0.0.0.0/0               md5
EOF

# Создаем recovery.conf для slave
cat > slave/config/recovery.conf << 'EOF'
# Recovery configuration для slave

standby_mode = 'on'
primary_conninfo = 'host=postgres-master port=5432 user=replica password=replica_password application_name=slave1'
recovery_target_timeline = 'latest'
restore_command = 'cp /var/lib/postgresql/archive/%f %p'
archive_cleanup_command = 'pg_archivecleanup /var/lib/postgresql/archive %r'
EOF

# Создаем Docker Compose для PostgreSQL кластера
echo "Создание docker-compose.yml для PostgreSQL кластера..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres-master:
    image: postgres:13
    container_name: postgres-master
    environment:
      POSTGRES_DB: messenger
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres_password
      POSTGRES_REPLICATION_USER: replica
      POSTGRES_REPLICATION_PASSWORD: replica_password
    ports:
      - "5432:5432"
    volumes:
      - ./master/config/postgresql.conf:/etc/postgresql/postgresql.conf
      - ./master/config/pg_hba.conf:/etc/postgresql/pg_hba.conf
      - ./init-scripts:/docker-entrypoint-initdb.d
      - postgres_master_data:/var/lib/postgresql/data
      - postgres_archive:/var/lib/postgresql/archive
    command: >
      postgres
      -c config_file=/etc/postgresql/postgresql.conf
      -c hba_file=/etc/postgresql/pg_hba.conf
    networks:
      - postgres-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 5

  postgres-slave:
    image: postgres:13
    container_name: postgres-slave
    environment:
      POSTGRES_DB: messenger
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres_password
      PGUSER: postgres
    ports:
      - "5433:5432"
    volumes:
      - ./slave/config/postgresql.conf:/etc/postgresql/postgresql.conf
      - ./slave/config/pg_hba.conf:/etc/postgresql/pg_hba.conf
      - ./slave/config/recovery.conf:/var/lib/postgresql/recovery.conf
      - postgres_slave_data:/var/lib/postgresql/data
      - postgres_archive:/var/lib/postgresql/archive
    command: >
      bash -c "
      if [ ! -f /var/lib/postgresql/data/PG_VERSION ]; then
        echo 'Инициализация slave из master...'
        pg_basebackup -h postgres-master -D /var/lib/postgresql/data -U replica -W -v -P -R
        cp /var/lib/postgresql/recovery.conf /var/lib/postgresql/data/
      fi
      postgres -c config_file=/etc/postgresql/postgresql.conf -c hba_file=/etc/postgresql/pg_hba.conf
      "
    networks:
      - postgres-network
    depends_on:
      postgres-master:
        condition: service_healthy

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@messenger.local
      PGADMIN_DEFAULT_PASSWORD: admin_password
    ports:
      - "8080:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    networks:
      - postgres-network
    depends_on:
      - postgres-master

volumes:
  postgres_master_data:
  postgres_slave_data:
  postgres_archive:
  pgadmin_data:

networks:
  postgres-network:
    driver: bridge
EOF

# Создаем скрипты инициализации базы данных
echo "Создание скриптов инициализации..."
mkdir -p init-scripts

cat > init-scripts/01-create-replication-user.sql << 'EOF'
-- Создание пользователя для репликации
CREATE USER replica WITH REPLICATION ENCRYPTED PASSWORD 'replica_password';

-- Создание пользователя для мессенджера
CREATE USER messenger_user WITH ENCRYPTED PASSWORD 'messenger_password';

-- Создание базы данных для мессенджера
CREATE DATABASE messenger OWNER messenger_user;
CREATE DATABASE messenger_test OWNER messenger_user;

-- Предоставление прав
GRANT ALL PRIVILEGES ON DATABASE messenger TO messenger_user;
GRANT ALL PRIVILEGES ON DATABASE messenger_test TO messenger_user;
EOF

cat > init-scripts/02-create-messenger-schema.sql << 'EOF'
-- Подключаемся к базе данных мессенджера
\c messenger;

-- Создание схемы для мессенджера
CREATE SCHEMA IF NOT EXISTS messenger_schema;

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    avatar_url VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица чатов
CREATE TABLE IF NOT EXISTS chats (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    description TEXT,
    chat_type VARCHAR(20) DEFAULT 'private', -- private, group, channel
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица участников чатов
CREATE TABLE IF NOT EXISTS chat_members (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member', -- admin, moderator, member
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chat_id, user_id)
);

-- Таблица сообщений
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- text, image, file, system
    reply_to INTEGER REFERENCES messages(id),
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_members_chat_id ON chat_members(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_user_id ON chat_members(user_id);

-- Предоставление прав пользователю мессенджера
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO messenger_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO messenger_user;
EOF

# Создаем скрипт для запуска кластера
cat > start-postgres-cluster.sh << 'EOF'
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
EOF

chmod +x start-postgres-cluster.sh

# Создаем скрипт для тестирования репликации
cat > test-replication.sh << 'EOF'
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
EOF

chmod +x test-replication.sh

echo "✅ PostgreSQL репликация настроена в директории postgres-replication/"
echo ""
echo "Созданные файлы:"
find . -name "*.conf" -o -name "*.sql" -o -name "*.sh" -o -name "*.yml" | sort

echo ""
echo "Содержимое конфигурации Master:"
echo "==============================="
head -20 master/config/postgresql.conf

echo ""
echo "Для запуска кластера выполните:"
echo "cd postgres-replication && ./start-postgres-cluster.sh"
echo ""
echo "Для тестирования репликации:"
echo "cd postgres-replication && ./test-replication.sh"
