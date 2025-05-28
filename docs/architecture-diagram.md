# CI/CD Pipeline Architecture

## Рис. 5 - Схема взаимодействия GitHub Actions, Docker Hub и Kubernetes

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
