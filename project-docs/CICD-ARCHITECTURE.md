# 🚀 DevDialogue CI/CD Architecture

## Приложение А, Рис. 5 - Схема взаимодействия GitHub Actions, Docker Hub и Kubernetes

### 📊 Детальная архитектурная диаграмма
![CI/CD Architecture](docs/cicd-architecture-diagram.png)

### 🔄 Упрощенная схема потока данных
![Simplified Flow](docs/cicd-simplified-flow.png)

```mermaid
graph TB
    subgraph "👨‍💻 Developer Workflow"
        DEV[Developer] --> COMMIT[Git Commit/Push]
    end

    subgraph "🚀 GitHub Actions CI/CD"
        COMMIT --> TRIGGER[Workflow Trigger]
        TRIGGER --> BUILD[Build & Test]
        BUILD --> DOCKER_BUILD[Docker Build]
        DOCKER_BUILD --> SECURITY[Security Scan]
        SECURITY --> DOCKER_PUSH[Push to Docker Hub]
    end

    subgraph "🐳 Docker Hub Registry"
        DOCKER_PUSH --> REGISTRY[(Docker Hub<br/>devdialogue-backend<br/>devdialogue-frontend)]
    end

    subgraph "☸️ Kubernetes Cluster"
        REGISTRY --> K8S_PULL[Image Pull]
        K8S_PULL --> STAGING[Staging Deploy]
        STAGING --> SMOKE[Smoke Tests]
        SMOKE --> PROD_DEPLOY{Production Deploy?}

        PROD_DEPLOY -->|Yes| BLUE_GREEN[Blue-Green Strategy]
        BLUE_GREEN --> GREEN_DEPLOY[Deploy to Green]
        GREEN_DEPLOY --> HEALTH_CHECK[Health Checks]
        HEALTH_CHECK --> TRAFFIC_SWITCH[Traffic Switch]
        TRAFFIC_SWITCH --> CLEANUP[Blue Cleanup]

        PROD_DEPLOY -->|No| END_STAGING[Staging Complete]
    end

    subgraph "📊 Monitoring & Notifications"
        CLEANUP --> MONITOR[Performance Monitoring]
        END_STAGING --> NOTIFY[Notifications]
        MONITOR --> NOTIFY
        NOTIFY --> SLACK[Slack/Email Alerts]
    end

    %% Data Flow Annotations
    COMMIT -.->|"Webhook"| TRIGGER
    DOCKER_PUSH -.->|"Image Push"| REGISTRY
    REGISTRY -.->|"Image Pull"| K8S_PULL
    TRAFFIC_SWITCH -.->|"Load Balancer Update"| MONITOR

    %% Styling
    classDef github fill:#f9f,stroke:#333,stroke-width:2px
    classDef docker fill:#0db7ed,stroke:#333,stroke-width:2px,color:#fff
    classDef k8s fill:#326ce5,stroke:#333,stroke-width:2px,color:#fff
    classDef monitor fill:#ff6b6b,stroke:#333,stroke-width:2px,color:#fff

    class TRIGGER,BUILD,DOCKER_BUILD,SECURITY,DOCKER_PUSH github
    class REGISTRY,K8S_PULL docker
    class STAGING,SMOKE,PROD_DEPLOY,BLUE_GREEN,GREEN_DEPLOY,HEALTH_CHECK,TRAFFIC_SWITCH,CLEANUP k8s
    class MONITOR,NOTIFY,SLACK monitor
```

## 📋 Описание этапов взаимодействия

### 1. **GitHub Actions** (Оркестратор CI/CD)
- **Триггер**: Webhook от Git push активирует workflow
- **Сборка**: Установка зависимостей, линтинг, тестирование
- **Docker Build**: Создание образов backend и frontend
- **Security Scan**: Проверка уязвимостей в коде и зависимостях
- **Push**: Отправка образов в Docker Hub с тегами

### 2. **Docker Hub** (Централизованный реестр образов)
- **Хранение**: Версионированные образы приложения
- **Теги**: SHA коммитов для точной идентификации версий
- **Доступ**: Безопасное получение образов Kubernetes кластером
- **Метаданные**: Информация о сборке и зависимостях

### 3. **Kubernetes** (Оркестратор контейнеров)
- **Image Pull**: Получение новых образов из Docker Hub
- **Staging Deploy**: Развертывание в тестовой среде
- **Smoke Tests**: Базовые проверки функциональности
- **Blue-Green Strategy**: Безопасное обновление production
- **Health Checks**: Мониторинг состояния приложения
- **Traffic Management**: Управление нагрузкой между версиями

### 4. **Мониторинг и уведомления**
- **Performance Monitoring**: Отслеживание метрик производительности
- **Alerting**: Автоматические уведомления о проблемах
- **Logging**: Централизованное логирование событий
- **Rollback**: Возможность быстрого отката при проблемах

## 🎯 Преимущества автоматизации

### ⚡ Скорость доставки
- Сокращение времени от коммита до production с **часов до минут**
- Автоматизация рутинных операций
- Параллельное выполнение этапов pipeline

### 🛡️ Стабильность и надежность
- Автоматизированное тестирование на каждом этапе
- Blue-Green deployment исключает простои
- Возможность быстрого отката к предыдущей версии

### 🔄 Непрерывная интеграция
- Раннее обнаружение конфликтов и ошибок
- Консистентная среда развертывания
- Автоматическая проверка качества кода

### 📊 Прозрачность процесса
- Полная трассируемость изменений
- Детальные логи каждого этапа
- Метрики производительности и качества
