#!/bin/bash

echo "=== Остановка ELK Stack ==="
docker-compose down

echo "Удаление volumes (опционально):"
echo "docker-compose down -v"
