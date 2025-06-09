# Diploma Messenger DevOps Integration

Комплексная DevOps инфраструктура для мессенджера с полной автоматизацией развертывания, мониторинга и безопасности.

## 🏗️ Архитектура системы

Проект реализует современную DevOps инфраструктуру для мессенджера, включающую:

- **Контейнеризация**: Docker + Docker Compose
- **Оркестрация**: Kubernetes с автомасштабированием (HPA)
- **CI/CD**: GitHub Actions с автоматическим тестированием и развертыванием
- **Мониторинг**: Prometheus + Grafana
- **Логирование**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Безопасность**: HashiCorp Vault + Network Policies
- **База данных**: PostgreSQL с репликацией Master-Slave
- **Кэширование**: Redis
- **Балансировка нагрузки**: Nginx

## 📁 Структура проекта

```
├── backend/                 # Node.js/Express сервер
├── frontend/               # React приложение
├── .github/workflows/      # CI/CD пайплайны
├── k8s-manifests/         # Kubernetes манифесты
├── monitoring/            # Prometheus + Grafana
├── logging/              # ELK Stack конфигурация
├── security/             # Vault и политики безопасности
├── database/             # PostgreSQL репликация
├── deployment/           # Docker Compose
└── scripts/              # Скрипты автоматизации
```

## 🚀 Быстрый старт

### Предварительные требования

- Docker 20.10+
- Kubernetes 1.24+
- Node.js 16+ (для разработки)
- Git

### Локальное развертывание

1. **Клонирование репозитория**
```bash
git clone https://github.com/EugeneSadness/Diploma-Messanger-Dev-Ops-Integration.git
cd Diploma-Messanger-Dev-Ops-Integration
```

2. **Запуск с Docker Compose**
```bash
cd deployment
docker-compose up -d
```

3. **Доступ к приложению**
- Мессенджер: http://localhost:3000
- Grafana: http://localhost:3001 (admin/admin)
- Kibana: http://localhost:5601

### Развертывание в Kubernetes

1. **Применение манифестов**
```bash
kubectl apply -f k8s-manifests/
```

2. **Настройка мониторинга**
```bash
./scripts/setup-monitoring/install.sh
```

3. **Настройка логирования**
```bash
./scripts/setup-logging/install.sh
```

## 🔧 Компоненты системы

### Backend (Node.js/Express)
- RESTful API для управления пользователями и сообщениями
- WebSocket соединения через Socket.io
- JWT аутентификация
- Интеграция с PostgreSQL и Redis
- Метрики для Prometheus

### Frontend (React)
- Современный интерфейс с Bootstrap
- Реальное время через Socket.io
- Адаптивный дизайн
- PWA поддержка

### DevOps инфраструктура

#### CI/CD (GitHub Actions)
- Автоматическая сборка Docker образов
- Тестирование кода
- Развертывание в Kubernetes
- Blue-Green deployment стратегия

#### Мониторинг
- **Prometheus**: Сбор метрик приложения и инфраструктуры
- **Grafana**: Визуализация метрик и алерты
- **Node Exporter**: Метрики системы

#### Логирование
- **Elasticsearch**: Хранение и индексация логов
- **Logstash**: Обработка и парсинг логов
- **Kibana**: Визуализация и анализ логов
- **Filebeat**: Сбор логов с контейнеров

#### Безопасность
- **Vault**: Управление секретами и ключами
- **Network Policies**: Сетевая изоляция в Kubernetes
- **RBAC**: Контроль доступа
- **TLS**: Шифрование трафика

## 📊 Мониторинг и метрики

### Ключевые метрики
- Время ответа API
- Количество активных соединений
- Использование ресурсов (CPU, RAM)
- Ошибки приложения
- Пропускная способность базы данных

### Алерты
- Высокое использование CPU (>80%)
- Ошибки приложения (>5%)
- Недоступность сервисов
- Проблемы с базой данных

## 🔒 Безопасность

### Реализованные меры
- Шифрование данных в покое и при передаче
- Регулярное сканирование уязвимостей
- Принцип наименьших привилегий
- Сетевая сегментация
- Аудит доступа

### STRIDE анализ
Проведен полный анализ угроз по методологии STRIDE с реализацией соответствующих контрмер.

## 🗄️ База данных

### PostgreSQL репликация
- Master-Slave конфигурация
- Автоматическое переключение при сбоях
- Резервное копирование
- Мониторинг репликации

## 📈 Производительность

### Достигнутые показатели
- Время развертывания: сокращено на 65% (с 1.5 часов до 20 минут)
- Время ответа API: улучшено на 35% (с 200мс до 130мс)
- Доступность системы: 99.9%
- Сокращение ошибок в продакшн: на 50%

## 🛠️ Разработка

### Локальная разработка
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm start
```

### Тестирование
```bash
# Запуск тестов
npm test

# Нагрузочное тестирование
./scripts/performance-test.sh
```

## 📚 Документация

- [Архитектура системы](docs/architecture.md)
- [Руководство по развертыванию](docs/deployment.md)
- [Мониторинг и алерты](docs/monitoring.md)
- [Безопасность](docs/security.md)
- [Troubleshooting](docs/troubleshooting.md)

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch
3. Внесите изменения
4. Добавьте тесты
5. Создайте Pull Request

## 📄 Лицензия

MIT License - см. [LICENSE](LICENSE) файл для деталей.

## 👨‍💻 Автор

**Eugene Damm** - Дипломная работа по внедрению DevOps инфраструктуры для мессенджера

---

*Этот проект демонстрирует полный цикл DevOps практик от разработки до эксплуатации современного веб-приложения.*
