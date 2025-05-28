# Diploma Scripts - DevOps Infrastructure Automation

Этот каталог содержит bash-скрипты для автоматизации создания компонентов DevOps-инфраструктуры мессенджера, описанных в файле `diploma/screenshots.md`.

## Структура проекта

```
diploma-scripts/
├── README.md                    # Этот файл
├── setup-docker/               # Скрипты для Docker
│   ├── create-dockerfile.sh    # Создание Dockerfile для Node.js сервиса
│   ├── run-monitoring.sh       # Запуск Grafana и Prometheus
│   └── docker-commands.sh      # Основные Docker команды
├── setup-kubernetes/           # Скрипты для Kubernetes
│   ├── create-hpa.sh          # Создание HPA конфигурации
│   └── k8s-commands.sh        # Основные Kubernetes команды
├── setup-cicd/                # Скрипты для CI/CD
│   ├── create-github-actions.sh # Создание GitHub Actions workflow
│   └── cicd-commands.sh       # CI/CD команды
├── setup-logging/              # Скрипты для логирования
│   ├── create-elk-stack.sh    # Настройка ELK stack
│   └── logging-commands.sh    # Команды для работы с логами
├── setup-security/             # Скрипты для безопасности
│   ├── create-vault-config.sh # Настройка Vault
│   └── security-commands.sh   # Команды безопасности
├── setup-database/             # Скрипты для базы данных
│   ├── create-postgres-config.sh # Настройка PostgreSQL репликации
│   └── database-commands.sh   # Команды для работы с БД
└── run-all.sh                  # Главный скрипт для запуска всех компонентов
```

## Использование

### Быстрый старт
```bash
# Сделать все скрипты исполняемыми
chmod +x diploma-scripts/**/*.sh

# Запустить все компоненты
./diploma-scripts/run-all.sh
```

### Отдельные компоненты
```bash
# Docker и контейнеризация
./diploma-scripts/setup-docker/create-dockerfile.sh
./diploma-scripts/setup-docker/run-monitoring.sh

# Kubernetes оркестрация
./diploma-scripts/setup-kubernetes/create-hpa.sh

# CI/CD pipeline
./diploma-scripts/setup-cicd/create-github-actions.sh

# ELK Stack для логирования
./diploma-scripts/setup-logging/create-elk-stack.sh

# Vault для безопасности
./diploma-scripts/setup-security/create-vault-config.sh

# PostgreSQL репликация
./diploma-scripts/setup-database/create-postgres-config.sh
```

## Требования

- Docker и Docker Compose
- Kubernetes (kubectl)
- Git
- Bash shell
- Интернет соединение для загрузки образов

## Примечания

Все скрипты созданы на основе инструкций из файла `diploma/screenshots.md` и предназначены для демонстрации DevOps-практик в рамках дипломного проекта.
