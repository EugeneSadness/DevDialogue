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
