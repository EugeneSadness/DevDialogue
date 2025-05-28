# CI/CD Pipeline Architecture

## Рис. 5 - Схема взаимодействия GitHub Actions, Docker Hub и Kubernetes

```mermaid
graph TB
    subgraph "👨‍💻 Рабочий процесс разработчика"
        DEV[Разработчик] --> COMMIT[Git Коммит/Отправка]
    end

    subgraph "🚀 GitHub Actions CI/CD"
        COMMIT --> TRIGGER[Запуск рабочего процесса]
        TRIGGER --> BUILD[Сборка и тестирование]
        BUILD --> DOCKER_BUILD[Сборка Docker]
        DOCKER_BUILD --> SECURITY[Проверка безопасности]
        SECURITY --> DOCKER_PUSH[Отправка в Docker Hub]
    end

    subgraph "🐳 Реестр Docker Hub"
        DOCKER_PUSH --> REGISTRY[(Docker Hub<br/>devdialogue-backend<br/>devdialogue-frontend)]
    end

    subgraph "☸️ Кластер Kubernetes"
        REGISTRY --> K8S_PULL[Загрузка образов]
        K8S_PULL --> STAGING[Развертывание в Staging]
        STAGING --> SMOKE[Базовые проверки]
        SMOKE --> PROD_DEPLOY{Развертывание в Production?}

        PROD_DEPLOY -->|Да| BLUE_GREEN[Стратегия Blue-Green]
        BLUE_GREEN --> GREEN_DEPLOY[Развертывание в Green]
        GREEN_DEPLOY --> HEALTH_CHECK[Проверки работоспособности]
        HEALTH_CHECK --> TRAFFIC_SWITCH[Переключение трафика]
        TRAFFIC_SWITCH --> CLEANUP[Очистка Blue]

        PROD_DEPLOY -->|Нет| END_STAGING[Staging завершен]
    end

    subgraph "📊 Мониторинг и уведомления"
        CLEANUP --> MONITOR[Мониторинг производительности]
        END_STAGING --> NOTIFY[Уведомления]
        MONITOR --> NOTIFY
        NOTIFY --> SLACK[Slack/Email оповещения]
    end

    %% Аннотации потока данных
    COMMIT -.->|"Вебхук"| TRIGGER
    DOCKER_PUSH -.->|"Отправка образа"| REGISTRY
    REGISTRY -.->|"Загрузка образа"| K8S_PULL
    TRAFFIC_SWITCH -.->|"Обновление балансировщика"| MONITOR

    %% Стилизация
    classDef github fill:#f9f,stroke:#333,stroke-width:2px
    classDef docker fill:#0db7ed,stroke:#333,stroke-width:2px,color:#fff
    classDef k8s fill:#326ce5,stroke:#333,stroke-width:2px,color:#fff
    classDef monitor fill:#ff6b6b,stroke:#333,stroke-width:2px,color:#fff

    class TRIGGER,BUILD,DOCKER_BUILD,SECURITY,DOCKER_PUSH github
    class REGISTRY,K8S_PULL docker
    class STAGING,SMOKE,PROD_DEPLOY,BLUE_GREEN,GREEN_DEPLOY,HEALTH_CHECK,TRAFFIC_SWITCH,CLEANUP k8s
    class MONITOR,NOTIFY,SLACK monitor
```

## Описание взаимодействия

### 1. **GitHub Actions** (Оркестратор)
- Получает webhook от Git push
- Выполняет сборку и тестирование
- Создает Docker образы
- Отправляет образы в Docker Hub

### 2. **Docker Hub** (Реестр образов)
- Хранит версионированные образы
- Обеспечивает доступ для Kubernetes
- Поддерживает теги и метаданные

### 3. **Kubernetes** (Среда выполнения)
- Получает образы из Docker Hub
- Управляет развертыванием
- Реализует Blue-Green стратегию
- Обеспечивает мониторинг и масштабирование

### 4. **Преимущества автоматизации**
- ⚡ Сокращение времени доставки с часов до минут
- 🛡️ Повышение стабильности через автоматизированное тестирование
- 🔄 Безопасные обновления без простоев
- 📊 Непрерывный мониторинг и быстрое реагирование
