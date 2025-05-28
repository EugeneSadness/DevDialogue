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
