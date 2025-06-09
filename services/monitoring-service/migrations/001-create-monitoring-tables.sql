-- Migration: Create monitoring service tables
-- Version: 001
-- Description: Initial tables for monitoring service

-- Таблица метрик сервисов
CREATE TABLE IF NOT EXISTS service_metrics (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,6) NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- counter, gauge, histogram
    labels JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица проверок здоровья сервисов
CREATE TABLE IF NOT EXISTS health_checks (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL, -- healthy, unhealthy, degraded
    response_time_ms INTEGER,
    error_message TEXT,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица логов системы
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    level VARCHAR(20) NOT NULL, -- error, warn, info, debug
    message TEXT NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица алертов
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    alert_name VARCHAR(100) NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL, -- critical, warning, info
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица конфигурации мониторинга
CREATE TABLE IF NOT EXISTS monitoring_config (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL UNIQUE,
    health_check_url VARCHAR(500) NOT NULL,
    check_interval_seconds INTEGER DEFAULT 30,
    timeout_seconds INTEGER DEFAULT 10,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица статистики uptime
CREATE TABLE IF NOT EXISTS uptime_stats (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    total_checks INTEGER DEFAULT 0,
    successful_checks INTEGER DEFAULT 0,
    uptime_percentage DECIMAL(5,2) DEFAULT 0.00,
    avg_response_time_ms DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(service_name, date)
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_service_metrics_service_name ON service_metrics(service_name);
CREATE INDEX IF NOT EXISTS idx_service_metrics_timestamp ON service_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_service_metrics_metric_name ON service_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_health_checks_service_name ON health_checks(service_name);
CREATE INDEX IF NOT EXISTS idx_health_checks_checked_at ON health_checks(checked_at);
CREATE INDEX IF NOT EXISTS idx_health_checks_status ON health_checks(status);
CREATE INDEX IF NOT EXISTS idx_system_logs_service_name ON system_logs(service_name);
CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON system_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_alerts_service_name ON alerts(service_name);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_is_resolved ON alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_monitoring_config_service_name ON monitoring_config(service_name);
CREATE INDEX IF NOT EXISTS idx_uptime_stats_service_name ON uptime_stats(service_name);
CREATE INDEX IF NOT EXISTS idx_uptime_stats_date ON uptime_stats(date);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER update_monitoring_config_updated_at 
    BEFORE UPDATE ON monitoring_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Функция для автоматического обновления resolved_at при разрешении алерта
CREATE OR REPLACE FUNCTION update_alert_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_resolved = false AND NEW.is_resolved = true THEN
        NEW.resolved_at = CURRENT_TIMESTAMP;
    ELSIF OLD.is_resolved = true AND NEW.is_resolved = false THEN
        NEW.resolved_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_alert_resolved_at_trigger
    BEFORE UPDATE ON alerts
    FOR EACH ROW EXECUTE FUNCTION update_alert_resolved_at();

-- Функция для очистки старых метрик (старше 30 дней)
CREATE OR REPLACE FUNCTION cleanup_old_metrics()
RETURNS void AS $$
BEGIN
    DELETE FROM service_metrics 
    WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '30 days';
    
    DELETE FROM health_checks 
    WHERE checked_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
    
    DELETE FROM system_logs 
    WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '30 days';
END;
$$ language 'plpgsql';

-- Вставка базовой конфигурации мониторинга
INSERT INTO monitoring_config (service_name, health_check_url, check_interval_seconds, timeout_seconds) VALUES
('auth-service', 'http://auth-service:3001/health', 30, 10),
('message-service', 'http://message-service:3002/health', 30, 10),
('notification-service', 'http://notification-service:3003/health', 30, 10),
('monitoring-service', 'http://monitoring-service:3004/health', 60, 10)
ON CONFLICT (service_name) DO NOTHING;

-- Комментарии к таблицам
COMMENT ON TABLE service_metrics IS 'Метрики производительности сервисов';
COMMENT ON TABLE health_checks IS 'История проверок здоровья сервисов';
COMMENT ON TABLE system_logs IS 'Централизованные логи всех сервисов';
COMMENT ON TABLE alerts IS 'Алерты и уведомления о проблемах';
COMMENT ON TABLE monitoring_config IS 'Конфигурация мониторинга сервисов';
COMMENT ON TABLE uptime_stats IS 'Статистика uptime по дням';

-- Комментарии к колонкам
COMMENT ON COLUMN service_metrics.metric_type IS 'Тип метрики: counter, gauge, histogram';
COMMENT ON COLUMN service_metrics.labels IS 'Дополнительные метки в JSON формате';
COMMENT ON COLUMN health_checks.status IS 'Статус: healthy, unhealthy, degraded';
COMMENT ON COLUMN system_logs.level IS 'Уровень лога: error, warn, info, debug';
COMMENT ON COLUMN alerts.severity IS 'Серьезность: critical, warning, info';
COMMENT ON COLUMN uptime_stats.uptime_percentage IS 'Процент uptime за день (0.00-100.00)';
