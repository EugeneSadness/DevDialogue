#!/bin/bash

# Главный скрипт для запуска всех компонентов DevOps-инфраструктуры мессенджера
# Основан на инструкциях из diploma/screenshots.md

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода заголовков
print_header() {
    echo -e "\n${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}\n"
}

# Функция для вывода успеха
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Функция для вывода предупреждения
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Функция для вывода ошибки
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Функция для отображения помощи
show_help() {
    echo "Использование: $0 [КОМАНДА]"
    echo ""
    echo "Доступные команды:"
    echo "  all           - Запустить все компоненты (по умолчанию)"
    echo "  docker        - Создать Docker конфигурации"
    echo "  kubernetes    - Создать Kubernetes манифесты"
    echo "  cicd          - Создать GitHub Actions workflows"
    echo "  logging       - Настроить ELK Stack"
    echo "  security      - Настроить Vault"
    echo "  database      - Настроить PostgreSQL репликацию"
    echo "  monitoring    - Запустить мониторинг (Grafana + Prometheus)"
    echo "  clean         - Очистить созданные файлы"
    echo "  status        - Показать статус всех сервисов"
    echo "  help          - Показать эту справку"
    echo ""
    echo "Примеры:"
    echo "  $0 all        # Создать все компоненты"
    echo "  $0 docker     # Только Docker конфигурации"
    echo "  $0 status     # Проверить статус сервисов"
}

# Функция для проверки зависимостей
check_dependencies() {
    print_header "Проверка зависимостей"
    
    local missing_deps=()
    
    # Проверяем Docker
    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    fi
    
    # Проверяем Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        missing_deps+=("docker-compose")
    fi
    
    # Проверяем kubectl (опционально)
    if ! command -v kubectl &> /dev/null; then
        print_warning "kubectl не установлен (нужен для Kubernetes)"
    fi
    
    # Проверяем git
    if ! command -v git &> /dev/null; then
        missing_deps+=("git")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Отсутствуют зависимости: ${missing_deps[*]}"
        echo "Установите их и повторите попытку."
        exit 1
    fi
    
    print_success "Все зависимости установлены"
}

# Функция для создания Docker конфигураций
setup_docker() {
    print_header "Настройка Docker"
    
    if [ -x "setup-docker/create-dockerfile.sh" ]; then
        ./setup-docker/create-dockerfile.sh
        print_success "Docker конфигурации созданы"
    else
        print_error "Скрипт setup-docker/create-dockerfile.sh не найден или не исполняемый"
    fi
}

# Функция для создания Kubernetes манифестов
setup_kubernetes() {
    print_header "Настройка Kubernetes"
    
    if [ -x "setup-kubernetes/create-hpa.sh" ]; then
        ./setup-kubernetes/create-hpa.sh
        print_success "Kubernetes манифесты созданы"
    else
        print_error "Скрипт setup-kubernetes/create-hpa.sh не найден или не исполняемый"
    fi
}

# Функция для создания CI/CD workflows
setup_cicd() {
    print_header "Настройка CI/CD"
    
    if [ -x "setup-cicd/create-github-actions.sh" ]; then
        ./setup-cicd/create-github-actions.sh
        print_success "GitHub Actions workflows созданы"
    else
        print_error "Скрипт setup-cicd/create-github-actions.sh не найден или не исполняемый"
    fi
}

# Функция для настройки логирования
setup_logging() {
    print_header "Настройка ELK Stack"
    
    if [ -x "setup-logging/create-elk-stack.sh" ]; then
        ./setup-logging/create-elk-stack.sh
        print_success "ELK Stack конфигурация создана"
    else
        print_error "Скрипт setup-logging/create-elk-stack.sh не найден или не исполняемый"
    fi
}

# Функция для настройки безопасности
setup_security() {
    print_header "Настройка Vault"
    
    if [ -x "setup-security/create-vault-config.sh" ]; then
        ./setup-security/create-vault-config.sh
        print_success "Vault конфигурация создана"
    else
        print_error "Скрипт setup-security/create-vault-config.sh не найден или не исполняемый"
    fi
}

# Функция для настройки базы данных
setup_database() {
    print_header "Настройка PostgreSQL репликации"
    
    if [ -x "setup-database/create-postgres-config.sh" ]; then
        ./setup-database/create-postgres-config.sh
        print_success "PostgreSQL репликация настроена"
    else
        print_error "Скрипт setup-database/create-postgres-config.sh не найден или не исполняемый"
    fi
}

# Функция для запуска мониторинга
start_monitoring() {
    print_header "Запуск мониторинга"
    
    if [ -x "setup-docker/run-monitoring.sh" ]; then
        ./setup-docker/run-monitoring.sh
        print_success "Мониторинг запущен"
    else
        print_error "Скрипт setup-docker/run-monitoring.sh не найден или не исполняемый"
    fi
}

# Функция для очистки
clean_all() {
    print_header "Очистка созданных файлов"
    
    read -p "Вы уверены, что хотите удалить все созданные файлы? (y/N): " CONFIRM
    
    if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
        echo "Операция отменена"
        exit 0
    fi
    
    # Останавливаем все Docker контейнеры
    echo "Остановка Docker контейнеров..."
    docker stop $(docker ps -q) 2>/dev/null || true
    
    # Удаляем созданные директории
    rm -rf messenger-service k8s-manifests .github elk-stack vault-setup postgres-replication monitoring-data
    
    print_success "Очистка завершена"
}

# Функция для проверки статуса
check_status() {
    print_header "Статус сервисов"
    
    echo "Docker контейнеры:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Docker не запущен"
    
    echo ""
    echo "Созданные директории:"
    ls -la | grep "^d" | grep -E "(messenger-service|k8s-manifests|elk-stack|vault-setup|postgres-replication)" || echo "Нет созданных директорий"
    
    echo ""
    echo "Доступные сервисы:"
    echo "🔗 Grafana:        http://localhost:3000"
    echo "🔗 Prometheus:     http://localhost:9090"
    echo "🔗 Kibana:         http://localhost:5601"
    echo "🔗 Vault:          http://localhost:8200"
    echo "🔗 pgAdmin:        http://localhost:8080"
    echo "🔗 Messenger API:  http://localhost:3000"
}

# Функция для запуска всех компонентов
run_all() {
    print_header "Запуск всех компонентов DevOps-инфраструктуры мессенджера"
    
    check_dependencies
    
    setup_docker
    setup_kubernetes
    setup_cicd
    setup_logging
    setup_security
    setup_database
    
    print_header "Сводка"
    print_success "Все компоненты созданы!"
    echo ""
    echo "📁 Созданные директории:"
    echo "   messenger-service/     - Docker конфигурации"
    echo "   k8s-manifests/         - Kubernetes манифесты"
    echo "   .github/workflows/     - GitHub Actions workflows"
    echo "   elk-stack/             - ELK Stack конфигурации"
    echo "   vault-setup/           - Vault конфигурации"
    echo "   postgres-replication/  - PostgreSQL репликация"
    echo ""
    echo "🚀 Следующие шаги:"
    echo "   1. Запустите мониторинг: $0 monitoring"
    echo "   2. Запустите ELK Stack: cd elk-stack && ./start-elk.sh"
    echo "   3. Запустите Vault: cd vault-setup && ./start-vault.sh"
    echo "   4. Запустите PostgreSQL: cd postgres-replication && ./start-postgres-cluster.sh"
    echo "   5. Соберите Docker образ: cd messenger-service && docker build -t messenger-service ."
    echo ""
    echo "📊 Проверьте статус: $0 status"
}

# Делаем все скрипты исполняемыми
make_executable() {
    find . -name "*.sh" -type f -exec chmod +x {} \;
    print_success "Все скрипты сделаны исполняемыми"
}

# Основная логика
main() {
    # Переходим в директорию скрипта
    cd "$(dirname "$0")"
    
    # Делаем скрипты исполняемыми
    make_executable
    
    # Обрабатываем аргументы
    case "${1:-all}" in
        all)
            run_all
            ;;
        docker)
            setup_docker
            ;;
        kubernetes)
            setup_kubernetes
            ;;
        cicd)
            setup_cicd
            ;;
        logging)
            setup_logging
            ;;
        security)
            setup_security
            ;;
        database)
            setup_database
            ;;
        monitoring)
            start_monitoring
            ;;
        clean)
            clean_all
            ;;
        status)
            check_status
            ;;
        help|*)
            show_help
            ;;
    esac
}

# Запускаем основную функцию
main "$@"
