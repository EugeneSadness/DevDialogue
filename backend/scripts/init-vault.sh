#!/bin/bash

# Настраиваем переменные окружения для Vault CLI
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=fullstack-root-token

# Проверяем, запущен ли Vault через docker-compose
if ! docker ps | grep -q vault; then
  echo "Vault не запущен. Запустите его с помощью docker-compose up -d vault"
  exit 1
fi

# Ждем, пока Vault будет доступен
echo "Ждем, пока Vault будет доступен..."
for i in {1..10}; do
  if curl -s $VAULT_ADDR/v1/sys/health > /dev/null; then
    echo "Vault доступен!"
    break
  fi
  if [ $i -eq 10 ]; then
    echo "Ошибка: Vault недоступен по адресу $VAULT_ADDR после 10 попыток"
    exit 1
  fi
  echo "Попытка $i: Vault еще не доступен, ждем 2 секунды..."
  sleep 2
done

# Включаем KV версии 2 (если еще не включен)
echo "Включаем KV версии 2..."
docker exec vault vault secrets enable -path=kv kv-v2 || echo "KV v2 уже включен или произошла ошибка"

# Создаем секреты для базы данных
echo "Создаем секреты для базы данных..."
docker exec vault vault kv put kv/app/database \
  database="test_messenger" \
  username="eugene" \
  password="king5681" \
  host="postgres" \
  port="5432"

# Проверяем, что секреты созданы
echo "Проверяем созданные секреты..."
docker exec vault vault kv get kv/app/database

# Создаем секрет без префикса kv/data для совместимости
echo "Создаем секрет без префикса kv/data для совместимости..."
docker exec vault vault kv put kv/app/database \
  database="test_messenger" \
  username="eugene" \
  password="king5681" \
  host="postgres" \
  port="5432"

echo "Инициализация Vault завершена!"
