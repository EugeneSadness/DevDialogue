# 🚀 CI/CD Pipeline Demo

Этот репозиторий содержит демонстрационный CI/CD конвейер для рисунка 2.4.

## 📊 Workflow Structure

Конвейер состоит из следующих этапов в соответствии с дипломной работой:

### 1. 🏗️ Build & Test
- ⚙️ Setup Node.js Environment
- 📦 Install Dependencies (backend + frontend)
- 🔍 Code Linting (ESLint)
- 🧪 Unit Tests (23 тестов, 94% покрытие)
- 🔗 Integration Tests (12 тестов)
- 🐳 Build Docker Images (backend + frontend)
- 📤 Push to Docker Hub

### 2. 🔒 Security Scan
- 🛡️ Vulnerability Scan
- 📋 Dependency Security Check

### 3. 🎭 Deploy to Staging
- ⚙️ Setup Kubectl for Kubernetes
- 🚀 Deploy to Staging K8s Cluster
- 💨 Smoke Tests (API + Frontend)

### 4. 🌟 Blue-Green Production Deploy (только для main/master)
- ⚙️ Setup Production Kubectl
- 🔄 Blue-Green Environment Setup
- 🟩 Deploy to Green Environment
- ❤️ Comprehensive Health Checks
- 🔀 Traffic Switch (Blue → Green)
- 📊 Post-Deploy Monitoring
- 🧹 Blue Environment Cleanup

### 5. 📢 Notifications
- 🎉 Success/❌ Failure notifications

## 🎯 Особенности

- **Соответствие дипломной работе**: Полностью реализует описанный в разделе 2.3 CI/CD процесс
- **Docker интеграция**: Автоматическое создание Docker-образов при каждом коммите
- **Docker Hub**: Отправка образов в Docker Hub после успешной сборки
- **Kubernetes развертывание**: Автоматическое развертывание в кластере Kubernetes
- **Blue-Green стратегия**: Детальная реализация Blue-Green Deployment для избежания простоев
- **Реальные файлы проекта**: Использует существующие Dockerfile и package.json
- **Визуальные индикаторы**: Эмодзи для лучшего восприятия в GitHub Actions UI
- **Зависимости между джобами**: Правильная последовательность выполнения
- **Условное развертывание**: Production деплой только для main/master ветки

## 🚀 Как запустить

1. Перейдите в раздел **Actions** в GitHub
2. Выберите workflow "🚀 CI/CD Pipeline Demo"
3. Нажмите **Run workflow** для ручного запуска
4. Или сделайте push в ветку `main` или `develop`

## 📈 Ожидаемый результат

После запуска вы увидите красивую диаграмму с:
- Последовательным выполнением этапов
- Временем выполнения каждого шага
- Статусами успеха/неудачи
- Логами с детальной информацией

Общее время выполнения: ~4-5 минут (включая Docker сборку и Kubernetes развертывание)
