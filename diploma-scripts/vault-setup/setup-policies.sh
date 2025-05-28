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
