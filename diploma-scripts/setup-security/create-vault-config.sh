#!/bin/bash

# Скрипт для настройки HashiCorp Vault для управления секретами
# Основан на инструкциях из diploma/screenshots.md, раздел 2.7

set -e

echo "=== Настройка HashiCorp Vault для управления секретами ==="

# Создаем директорию для Vault
mkdir -p vault-setup
cd vault-setup

# Создаем конфигурацию Vault
echo "Создание конфигурации Vault..."
cat > vault-config.hcl << 'EOF'
# Хранилище данных
storage "file" {
  path = "/vault/data"
}

# Слушатель HTTP
listener "tcp" {
  address = "0.0.0.0:8200"
  tls_disable = 1
}

# API адрес
api_addr = "http://0.0.0.0:8200"

# Включаем UI
ui = true

# Настройки логирования
log_level = "Info"
log_format = "standard"

# Отключаем mlock для разработки (не для продакшн!)
disable_mlock = true

# Настройки кластера
cluster_addr = "http://0.0.0.0:8201"
EOF

# Создаем Docker Compose для Vault
echo "Создание docker-compose.yml для Vault..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  vault:
    image: vault:1.15.2
    container_name: vault-server
    ports:
      - "8200:8200"
      - "8201:8201"
    volumes:
      - ./vault-config.hcl:/vault/config/vault-config.hcl:ro
      - vault-data:/vault/data
      - vault-logs:/vault/logs
    environment:
      - VAULT_CONFIG_DIR=/vault/config
      - VAULT_ADDR=http://0.0.0.0:8200
    command: ["vault", "server", "-config=/vault/config/vault-config.hcl"]
    cap_add:
      - IPC_LOCK
    networks:
      - vault-network
    healthcheck:
      test: ["CMD", "vault", "status"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  vault-ui:
    image: djenriquez/vault-ui:latest
    container_name: vault-ui
    ports:
      - "8000:8000"
    environment:
      - VAULT_URL_DEFAULT=http://vault:8200
      - VAULT_AUTH_DEFAULT=USERPASS
    networks:
      - vault-network
    depends_on:
      - vault

volumes:
  vault-data:
  vault-logs:

networks:
  vault-network:
    driver: bridge
EOF

# Создаем скрипт инициализации Vault
echo "Создание скрипта инициализации..."
cat > init-vault.sh << 'EOF'
#!/bin/bash

echo "=== Инициализация Vault ==="

export VAULT_ADDR='http://localhost:8200'

# Ждем запуска Vault
echo "Ожидание запуска Vault..."
until curl -s $VAULT_ADDR/v1/sys/health > /dev/null; do
  echo "Vault еще не готов, ждем..."
  sleep 5
done

# Проверяем, инициализирован ли Vault
if vault status | grep -q "Initialized.*true"; then
  echo "Vault уже инициализирован"
  exit 0
fi

# Инициализируем Vault
echo "Инициализация Vault..."
vault operator init -key-shares=5 -key-threshold=3 > vault-keys.txt

echo "✅ Vault инициализирован!"
echo "🔑 Ключи сохранены в файл vault-keys.txt"
echo ""
echo "ВАЖНО: Сохраните файл vault-keys.txt в безопасном месте!"
echo "Он содержит unseal keys и root token."
echo ""

# Извлекаем unseal keys и root token
UNSEAL_KEY_1=$(grep 'Unseal Key 1:' vault-keys.txt | awk '{print $4}')
UNSEAL_KEY_2=$(grep 'Unseal Key 2:' vault-keys.txt | awk '{print $4}')
UNSEAL_KEY_3=$(grep 'Unseal Key 3:' vault-keys.txt | awk '{print $4}')
ROOT_TOKEN=$(grep 'Initial Root Token:' vault-keys.txt | awk '{print $4}')

# Разблокируем Vault
echo "Разблокировка Vault..."
vault operator unseal $UNSEAL_KEY_1
vault operator unseal $UNSEAL_KEY_2
vault operator unseal $UNSEAL_KEY_3

# Авторизуемся с root token
vault auth $ROOT_TOKEN

echo "✅ Vault разблокирован и готов к использованию!"
EOF

chmod +x init-vault.sh

# Создаем скрипт настройки политик и секретов
echo "Создание скрипта настройки политик..."
cat > setup-policies.sh << 'EOF'
#!/bin/bash

echo "=== Настройка политик и секретов Vault ==="

export VAULT_ADDR='http://localhost:8200'

# Проверяем, что Vault разблокирован
if ! vault status | grep -q "Sealed.*false"; then
  echo "❌ Vault заблокирован. Сначала запустите init-vault.sh"
  exit 1
fi

# Авторизуемся (предполагаем, что root token в переменной окружения)
if [ -z "$VAULT_TOKEN" ]; then
  if [ -f "vault-keys.txt" ]; then
    export VAULT_TOKEN=$(grep 'Initial Root Token:' vault-keys.txt | awk '{print $4}')
  else
    echo "❌ Установите VAULT_TOKEN или убедитесь, что файл vault-keys.txt существует"
    exit 1
  fi
fi

# Включаем KV secrets engine v2
echo "Включение KV secrets engine..."
vault secrets enable -path=messenger kv-v2

# Создаем политику для мессенджера
echo "Создание политики для мессенджера..."
cat > messenger-policy.hcl << 'POLICY_EOF'
# Политика для приложения мессенджера
path "messenger/data/config/*" {
  capabilities = ["read"]
}

path "messenger/data/database/*" {
  capabilities = ["read"]
}

path "messenger/data/api-keys/*" {
  capabilities = ["read"]
}

path "messenger/metadata/*" {
  capabilities = ["list", "read"]
}

# Разрешаем обновление собственного токена
path "auth/token/renew-self" {
  capabilities = ["update"]
}

path "auth/token/lookup-self" {
  capabilities = ["read"]
}
POLICY_EOF

vault policy write messenger-policy messenger-policy.hcl

# Создаем политику для разработчиков
cat > developer-policy.hcl << 'POLICY_EOF'
# Политика для разработчиков
path "messenger/data/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "messenger/metadata/*" {
  capabilities = ["list", "read", "delete"]
}

path "sys/policies/acl/messenger-*" {
  capabilities = ["read", "list"]
}
POLICY_EOF

vault policy write developer-policy developer-policy.hcl

# Включаем userpass auth method
echo "Настройка userpass аутентификации..."
vault auth enable userpass

# Создаем пользователей
vault write auth/userpass/users/messenger-app \
  password=messenger-secret-password \
  policies=messenger-policy

vault write auth/userpass/users/developer \
  password=dev-password \
  policies=developer-policy

# Добавляем секреты для мессенджера
echo "Добавление секретов..."

# Конфигурация базы данных
vault kv put messenger/config/database \
  host=postgres.messenger.local \
  port=5432 \
  database=messenger_prod \
  username=messenger_user \
  password=super_secure_db_password

# API ключи
vault kv put messenger/api-keys/external \
  jwt_secret=very_long_jwt_secret_key_for_production \
  encryption_key=32_character_encryption_key_123 \
  api_key=external_api_key_12345

# Конфигурация Redis
vault kv put messenger/config/redis \
  host=redis.messenger.local \
  port=6379 \
  password=redis_secure_password

# Настройки SMTP
vault kv put messenger/config/smtp \
  host=smtp.gmail.com \
  port=587 \
  username=messenger@company.com \
  password=smtp_app_password

# OAuth настройки
vault kv put messenger/config/oauth \
  google_client_id=google_oauth_client_id \
  google_client_secret=google_oauth_client_secret \
  github_client_id=github_oauth_client_id \
  github_client_secret=github_oauth_client_secret

echo "✅ Политики и секреты настроены!"
echo ""
echo "📋 Созданные пользователи:"
echo "   messenger-app (политика: messenger-policy)"
echo "   developer (политика: developer-policy)"
echo ""
echo "🔐 Созданные секреты:"
echo "   messenger/config/database"
echo "   messenger/api-keys/external"
echo "   messenger/config/redis"
echo "   messenger/config/smtp"
echo "   messenger/config/oauth"
echo ""
echo "🔗 Vault UI: http://localhost:8200"
echo "🔗 Vault UI (альтернативный): http://localhost:8000"
EOF

chmod +x setup-policies.sh

# Создаем скрипт для тестирования Vault
cat > test-vault.sh << 'EOF'
#!/bin/bash

echo "=== Тестирование Vault ==="

export VAULT_ADDR='http://localhost:8200'

# Тестируем аутентификацию пользователя приложения
echo "Тестирование аутентификации messenger-app..."
MESSENGER_TOKEN=$(vault write -field=token auth/userpass/login/messenger-app password=messenger-secret-password)

if [ -n "$MESSENGER_TOKEN" ]; then
  echo "✅ Аутентификация успешна"
  
  # Тестируем чтение секретов
  echo "Тестирование чтения секретов..."
  VAULT_TOKEN=$MESSENGER_TOKEN vault kv get messenger/config/database
  
  echo ""
  echo "Тестирование чтения API ключей..."
  VAULT_TOKEN=$MESSENGER_TOKEN vault kv get messenger/api-keys/external
else
  echo "❌ Ошибка аутентификации"
fi

echo ""
echo "Проверка статуса Vault:"
vault status
EOF

chmod +x test-vault.sh

# Создаем основной скрипт запуска
cat > start-vault.sh << 'EOF'
#!/bin/bash

echo "=== Запуск Vault ==="

# Запускаем Vault через Docker Compose
docker-compose up -d

echo "Ожидание запуска Vault..."
sleep 10

# Проверяем статус
docker-compose ps

echo ""
echo "✅ Vault запущен!"
echo ""
echo "Следующие шаги:"
echo "1. Инициализируйте Vault: ./init-vault.sh"
echo "2. Настройте политики: ./setup-policies.sh"
echo "3. Протестируйте: ./test-vault.sh"
echo ""
echo "🔗 Vault UI: http://localhost:8200"
echo "🔗 Vault UI (альтернативный): http://localhost:8000"
EOF

chmod +x start-vault.sh

echo "✅ Vault конфигурация создана в директории vault-setup/"
echo ""
echo "Созданные файлы:"
ls -la

echo ""
echo "Содержимое конфигурации Vault:"
echo "=============================="
cat vault-config.hcl

echo ""
echo "Для запуска Vault выполните:"
echo "cd vault-setup && ./start-vault.sh"
