#!/bin/bash

echo "=== Отправка тестовых логов ==="

# Отправляем тестовые логи через TCP
for i in {1..10}; do
  echo "{\"timestamp\":\"$(date -Iseconds)\",\"level\":\"INFO\",\"service\":\"messenger-api\",\"message\":\"Test log message $i\"}" | nc localhost 5000
  sleep 1
done

echo "Отправлено 10 тестовых логов"
echo "Проверьте их в Kibana: http://localhost:5601"
