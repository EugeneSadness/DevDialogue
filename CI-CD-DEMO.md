# 🚀 CI/CD Pipeline Demo

Этот репозиторий содержит демонстрационный CI/CD конвейер для рисунка 2.4.

## 📊 Workflow Structure

Конвейер состоит из следующих этапов:

### 1. 🏗️ Build & Test
- ⚙️ Setup Environment (5s)
- 📦 Install Dependencies (8s) 
- 🔍 Code Linting (6s)
- 🧪 Unit Tests (12s)
- 🔗 Integration Tests (15s)
- 🏗️ Build Application (10s)

### 2. 🔒 Security Scan
- 🛡️ Vulnerability Scan (8s)
- 📋 Dependency Check (6s)

### 3. 🎭 Deploy to Staging
- 🚀 Deploy to Staging (12s)
- 💨 Smoke Tests (8s)

### 4. 🌟 Deploy to Production (только для main ветки)
- 🔄 Blue-Green Setup (8s)
- 🟩 Deploy to Green (15s)
- ❤️ Health Check (6s)
- 🔀 Switch Traffic (5s)

### 5. 📢 Notifications
- 🎉 Success/❌ Failure notifications (3s)

## 🎯 Особенности

- **Имитация реальной работы**: Каждый шаг использует `sleep` для симуляции времени обработки
- **Визуальные индикаторы**: Эмодзи для лучшего восприятия в GitHub Actions UI
- **Зависимости между джобами**: Правильная последовательность выполнения
- **Условное развертывание**: Production деплой только для main ветки
- **Blue-Green стратегия**: Демонстрация современного подхода к развертыванию

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

Общее время выполнения: ~2-3 минуты
