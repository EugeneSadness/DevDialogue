#!/bin/bash

# Демонстрационный скрипт для показа всех возможностей DevOps-инфраструктуры
# Основан на инструкциях из diploma/screenshots.md

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Функция для вывода заголовков
print_header() {
    echo -e "\n${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║$(printf "%62s" " ")║${NC}"
    echo -e "${BLUE}║$(printf "%*s" $(((62 + ${#1})/2)) "$1")$(printf "%*s" $(((62 - ${#1})/2)) " ")║${NC}"
    echo -e "${BLUE}║$(printf "%62s" " ")║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}\n"
}

# Функция для вывода успеха
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Функция для вывода информации
print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Функция для вывода предупреждения
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Функция для паузы
pause_demo() {
    echo -e "\n${PURPLE}Нажмите Enter для продолжения...${NC}"
    read
}

# Функция для демонстрации Docker
demo_docker() {
    print_header "ДЕМОНСТРАЦИЯ DOCKER КОНТЕЙНЕРИЗАЦИИ"
    
    print_info "Создаем Dockerfile и конфигурации для Node.js мессенджера..."
    ./setup-docker/create-dockerfile.sh
    
    pause_demo
    
    print_info "Показываем основные Docker команды..."
    ./setup-docker/docker-commands.sh help
    
    pause_demo
    
    print_info "Собираем Docker образ..."
    ./setup-docker/docker-commands.sh build
    
    print_success "Docker контейнеризация настроена!"
}

# Функция для демонстрации Kubernetes
demo_kubernetes() {
    print_header "ДЕМОНСТРАЦИЯ KUBERNETES ОРКЕСТРАЦИИ"
    
    print_info "Создаем Kubernetes манифесты с HPA..."
    ./setup-kubernetes/create-hpa.sh
    
    pause_demo
    
    print_info "Показываем Kubernetes команды..."
    ./setup-kubernetes/k8s-commands.sh help
    
    print_success "Kubernetes оркестрация настроена!"
}

# Функция для демонстрации CI/CD
demo_cicd() {
    print_header "ДЕМОНСТРАЦИЯ CI/CD PIPELINE"
    
    print_info "Создаем GitHub Actions workflows..."
    ./setup-cicd/create-github-actions.sh
    
    pause_demo
    
    print_info "Настраиваем Git hooks и CI/CD команды..."
    ./setup-cicd/cicd-commands.sh setup
    
    pause_demo
    
    print_info "Запускаем линтеры и тесты..."
    ./setup-cicd/cicd-commands.sh lint
    ./setup-cicd/cicd-commands.sh test
    
    print_success "CI/CD pipeline настроен!"
}

# Функция для демонстрации мониторинга
demo_monitoring() {
    print_header "ДЕМОНСТРАЦИЯ МОНИТОРИНГА (PROMETHEUS + GRAFANA)"
    
    print_info "Запускаем Prometheus и Grafana..."
    ./setup-docker/run-monitoring.sh
    
    pause_demo
    
    print_info "Мониторинг доступен по адресам:"
    echo -e "${CYAN}🔗 Prometheus: http://localhost:9090${NC}"
    echo -e "${CYAN}🔗 Grafana: http://localhost:3000 (admin/admin123)${NC}"
    
    print_success "Мониторинг запущен!"
}

# Функция для демонстрации логирования
demo_logging() {
    print_header "ДЕМОНСТРАЦИЯ ELK STACK ЛОГИРОВАНИЯ"
    
    print_info "Создаем конфигурацию ELK Stack..."
    ./setup-logging/create-elk-stack.sh
    
    pause_demo
    
    print_info "Запускаем ELK Stack..."
    cd elk-stack && ./start-elk.sh && cd ..
    
    pause_demo
    
    print_info "Отправляем тестовые логи..."
    ./setup-logging/logging-commands.sh test
    
    print_info "ELK Stack доступен по адресам:"
    echo -e "${CYAN}🔗 Kibana: http://localhost:5601${NC}"
    echo -e "${CYAN}🔗 Elasticsearch: http://localhost:9200${NC}"
    
    print_success "ELK Stack логирование настроено!"
}

# Функция для демонстрации безопасности
demo_security() {
    print_header "ДЕМОНСТРАЦИЯ VAULT БЕЗОПАСНОСТИ"
    
    print_info "Создаем конфигурацию Vault..."
    ./setup-security/create-vault-config.sh
    
    pause_demo
    
    print_info "Запускаем Vault..."
    cd vault-setup && ./start-vault.sh && cd ..
    
    pause_demo
    
    print_info "Инициализируем Vault..."
    cd vault-setup && ./init-vault.sh && cd ..
    
    pause_demo
    
    print_info "Настраиваем политики и секреты..."
    cd vault-setup && ./setup-policies.sh && cd ..
    
    print_info "Vault доступен по адресам:"
    echo -e "${CYAN}🔗 Vault UI: http://localhost:8200${NC}"
    echo -e "${CYAN}🔗 Vault UI (альтернативный): http://localhost:8000${NC}"
    
    print_success "Vault безопасность настроена!"
}

# Функция для демонстрации базы данных
demo_database() {
    print_header "ДЕМОНСТРАЦИЯ POSTGRESQL РЕПЛИКАЦИИ"
    
    print_info "Создаем конфигурацию PostgreSQL репликации..."
    ./setup-database/create-postgres-config.sh
    
    pause_demo
    
    print_info "Запускаем PostgreSQL кластер..."
    cd postgres-replication && ./start-postgres-cluster.sh && cd ..
    
    pause_demo
    
    print_info "Тестируем репликацию..."
    cd postgres-replication && ./test-replication.sh && cd ..
    
    print_info "PostgreSQL доступен по адресам:"
    echo -e "${CYAN}🔗 Master: localhost:5432${NC}"
    echo -e "${CYAN}🔗 Slave: localhost:5433${NC}"
    echo -e "${CYAN}🔗 pgAdmin: http://localhost:8080${NC}"
    
    print_success "PostgreSQL репликация настроена!"
}

# Функция для показа итогового статуса
show_final_status() {
    print_header "ИТОГОВЫЙ СТАТУС ИНФРАСТРУКТУРЫ"
    
    echo -e "${CYAN}🐳 Docker контейнеры:${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Docker не запущен"
    
    echo -e "\n${CYAN}📁 Созданные компоненты:${NC}"
    echo "✅ messenger-service/     - Docker конфигурации"
    echo "✅ k8s-manifests/         - Kubernetes манифесты"
    echo "✅ .github/workflows/     - GitHub Actions workflows"
    echo "✅ elk-stack/             - ELK Stack конфигурации"
    echo "✅ vault-setup/           - Vault конфигурации"
    echo "✅ postgres-replication/  - PostgreSQL репликация"
    
    echo -e "\n${CYAN}🔗 Доступные сервисы:${NC}"
    echo "🌐 Messenger API:     http://localhost:3000"
    echo "📊 Grafana:           http://localhost:3000 (admin/admin123)"
    echo "📈 Prometheus:        http://localhost:9090"
    echo "📋 Kibana:            http://localhost:5601"
    echo "🔒 Vault:             http://localhost:8200"
    echo "🗄️  pgAdmin:           http://localhost:8080"
    
    echo -e "\n${CYAN}📚 Полезные команды:${NC}"
    echo "./run-all.sh status           - Проверить статус всех сервисов"
    echo "./setup-docker/docker-commands.sh help    - Docker команды"
    echo "./setup-kubernetes/k8s-commands.sh help   - Kubernetes команды"
    echo "./setup-logging/logging-commands.sh help  - ELK команды"
    
    print_success "Демонстрация DevOps-инфраструктуры завершена!"
}

# Функция для интерактивного меню
interactive_menu() {
    while true; do
        print_header "ДЕМОНСТРАЦИЯ DEVOPS ИНФРАСТРУКТУРЫ МЕССЕНДЖЕРА"
        
        echo -e "${CYAN}Выберите компонент для демонстрации:${NC}"
        echo "1) 🐳 Docker контейнеризация"
        echo "2) ☸️  Kubernetes оркестрация"
        echo "3) 🔄 CI/CD pipeline"
        echo "4) 📊 Мониторинг (Prometheus + Grafana)"
        echo "5) 📋 Логирование (ELK Stack)"
        echo "6) 🔒 Безопасность (Vault)"
        echo "7) 🗄️  База данных (PostgreSQL репликация)"
        echo "8) 🎯 Полная демонстрация (все компоненты)"
        echo "9) 📊 Показать статус"
        echo "0) Выход"
        
        echo -e "\n${PURPLE}Введите номер (0-9): ${NC}"
        read choice
        
        case $choice in
            1) demo_docker ;;
            2) demo_kubernetes ;;
            3) demo_cicd ;;
            4) demo_monitoring ;;
            5) demo_logging ;;
            6) demo_security ;;
            7) demo_database ;;
            8) 
                demo_docker
                demo_kubernetes
                demo_cicd
                demo_monitoring
                demo_logging
                demo_security
                demo_database
                show_final_status
                ;;
            9) ./run-all.sh status ;;
            0) 
                print_success "Демонстрация завершена!"
                exit 0
                ;;
            *) 
                print_warning "Неверный выбор. Попробуйте снова."
                ;;
        esac
        
        pause_demo
    done
}

# Основная функция
main() {
    # Переходим в директорию скрипта
    cd "$(dirname "$0")"
    
    # Проверяем аргументы
    if [ "$1" = "auto" ]; then
        # Автоматическая полная демонстрация
        demo_docker
        demo_kubernetes
        demo_cicd
        demo_monitoring
        demo_logging
        demo_security
        demo_database
        show_final_status
    else
        # Интерактивное меню
        interactive_menu
    fi
}

# Запускаем демонстрацию
main "$@"
