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
