#!/bin/bash

# Основные Kubernetes команды для управления мессенджером
# Основан на инструкциях из diploma/screenshots.md

set -e

echo "=== Kubernetes команды для проекта мессенджера ==="

# Функция для отображения помощи
show_help() {
    echo "Использование: $0 [КОМАНДА]"
    echo ""
    echo "Доступные команды:"
    echo "  deploy    - Развернуть приложение в кластере"
    echo "  status    - Показать статус всех ресурсов"
    echo "  hpa       - Показать статус автомасштабирования"
    echo "  logs      - Показать логи подов"
    echo "  scale     - Масштабировать приложение"
    echo "  delete    - Удалить приложение из кластера"
    echo "  port      - Настроить port-forward для доступа"
    echo "  describe  - Подробная информация о ресурсах"
    echo "  help      - Показать эту справку"
    echo ""
}

# Функция для развертывания
deploy_app() {
    echo "🚀 Развертывание мессенджера в Kubernetes..."
    
    if [ ! -d "k8s-manifests" ]; then
        echo "❌ Директория k8s-manifests не найдена. Сначала запустите create-hpa.sh"
        exit 1
    fi
    
    cd k8s-manifests
    ./deploy.sh
}

# Функция для показа статуса
show_status() {
    echo "📊 Статус ресурсов мессенджера:"
    echo "==============================="
    
    echo ""
    echo "Поды:"
    kubectl get pods -n messenger -o wide
    
    echo ""
    echo "Сервисы:"
    kubectl get services -n messenger
    
    echo ""
    echo "Deployments:"
    kubectl get deployments -n messenger
    
    echo ""
    echo "Ingress:"
    kubectl get ingress -n messenger
}

# Функция для показа HPA
show_hpa() {
    echo "📈 Статус автомасштабирования (HPA):"
    echo "===================================="
    
    kubectl get hpa -n messenger
    
    echo ""
    echo "Подробная информация о HPA:"
    kubectl describe hpa messenger-api-hpa -n messenger
}

# Функция для показа логов
show_logs() {
    echo "📋 Логи подов мессенджера:"
    echo "=========================="
    
    # Получаем список подов
    PODS=$(kubectl get pods -n messenger -l app=messenger-api -o jsonpath='{.items[*].metadata.name}')
    
    if [ -z "$PODS" ]; then
        echo "❌ Поды не найдены"
        return 1
    fi
    
    echo "Доступные поды: $PODS"
    echo ""
    
    # Показываем логи первого пода
    FIRST_POD=$(echo $PODS | cut -d' ' -f1)
    echo "Логи пода $FIRST_POD:"
    kubectl logs $FIRST_POD -n messenger --tail=50 -f
}

# Функция для масштабирования
scale_app() {
    echo "⚖️ Масштабирование мессенджера..."
    
    read -p "Введите количество реплик (текущее: $(kubectl get deployment messenger-api -n messenger -o jsonpath='{.spec.replicas}')): " REPLICAS
    
    if [[ ! "$REPLICAS" =~ ^[0-9]+$ ]]; then
        echo "❌ Некорректное количество реплик"
        exit 1
    fi
    
    kubectl scale deployment messenger-api --replicas=$REPLICAS -n messenger
    
    echo "✅ Масштабирование запущено"
    echo "Ожидание обновления..."
    kubectl rollout status deployment/messenger-api -n messenger
}

# Функция для удаления
delete_app() {
    echo "🗑️ Удаление мессенджера из кластера..."
    
    read -p "Вы уверены, что хотите удалить приложение? (y/N): " CONFIRM
    
    if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
        echo "Операция отменена"
        exit 0
    fi
    
    kubectl delete namespace messenger
    echo "✅ Приложение удалено"
}

# Функция для port-forward
setup_port_forward() {
    echo "🔗 Настройка port-forward для доступа к приложению..."
    
    # Получаем первый под
    POD=$(kubectl get pods -n messenger -l app=messenger-api -o jsonpath='{.items[0].metadata.name}')
    
    if [ -z "$POD" ]; then
        echo "❌ Поды не найдены"
        exit 1
    fi
    
    echo "Настройка port-forward для пода: $POD"
    echo "Приложение будет доступно по адресу: http://localhost:8080"
    echo "Для остановки нажмите Ctrl+C"
    
    kubectl port-forward $POD 8080:3000 -n messenger
}

# Функция для подробной информации
describe_resources() {
    echo "🔍 Подробная информация о ресурсах:"
    echo "===================================="
    
    echo ""
    echo "=== Deployment ==="
    kubectl describe deployment messenger-api -n messenger
    
    echo ""
    echo "=== Service ==="
    kubectl describe service messenger-api-service -n messenger
    
    echo ""
    echo "=== HPA ==="
    kubectl describe hpa messenger-api-hpa -n messenger
}

# Обработка аргументов командной строки
case "${1:-help}" in
    deploy)
        deploy_app
        ;;
    status)
        show_status
        ;;
    hpa)
        show_hpa
        ;;
    logs)
        show_logs
        ;;
    scale)
        scale_app
        ;;
    delete)
        delete_app
        ;;
    port)
        setup_port_forward
        ;;
    describe)
        describe_resources
        ;;
    help|*)
        show_help
        ;;
esac
