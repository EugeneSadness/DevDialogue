-- Migration: Create notification service tables
-- Version: 001
-- Description: Initial tables for notification service

-- Таблица подписок на push уведомления
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL, -- user_id из auth_db
    endpoint TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, endpoint)
);

-- Таблица уведомлений
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL, -- user_id из auth_db
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'message', -- message, system, alert
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    is_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица настроек уведомлений пользователей
CREATE TABLE IF NOT EXISTS notification_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE, -- user_id из auth_db
    push_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT true,
    message_notifications BOOLEAN DEFAULT true,
    system_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица шаблонов уведомлений
CREATE TABLE IF NOT EXISTS notification_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    title_template VARCHAR(255) NOT NULL,
    body_template TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_is_active ON push_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_is_sent ON notifications(is_sent);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_name ON notification_templates(name);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(type);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_push_subscriptions_updated_at 
    BEFORE UPDATE ON push_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at 
    BEFORE UPDATE ON notification_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at 
    BEFORE UPDATE ON notification_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Функция для автоматического обновления sent_at при отправке уведомления
CREATE OR REPLACE FUNCTION update_notification_sent_at()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_sent = false AND NEW.is_sent = true THEN
        NEW.sent_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notification_sent_at_trigger
    BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_notification_sent_at();

-- Вставка базовых шаблонов уведомлений
INSERT INTO notification_templates (name, type, title_template, body_template) VALUES
('new_message', 'message', 'Новое сообщение от {{sender_name}}', '{{message_content}}'),
('chat_invite', 'system', 'Приглашение в чат', 'Вас пригласили в чат "{{chat_name}}"'),
('system_alert', 'alert', 'Системное уведомление', '{{alert_message}}'),
('welcome', 'system', 'Добро пожаловать!', 'Добро пожаловать в наш мессенджер!')
ON CONFLICT (name) DO NOTHING;

-- Комментарии к таблицам
COMMENT ON TABLE push_subscriptions IS 'Подписки пользователей на push уведомления';
COMMENT ON TABLE notifications IS 'История всех уведомлений';
COMMENT ON TABLE notification_settings IS 'Настройки уведомлений для каждого пользователя';
COMMENT ON TABLE notification_templates IS 'Шаблоны для различных типов уведомлений';

-- Комментарии к колонкам
COMMENT ON COLUMN push_subscriptions.endpoint IS 'URL endpoint для push уведомлений';
COMMENT ON COLUMN push_subscriptions.p256dh_key IS 'Публичный ключ для шифрования';
COMMENT ON COLUMN push_subscriptions.auth_key IS 'Ключ аутентификации';
COMMENT ON COLUMN notifications.type IS 'Тип уведомления: message, system, alert';
COMMENT ON COLUMN notifications.data IS 'Дополнительные данные в JSON формате';
COMMENT ON COLUMN notification_templates.title_template IS 'Шаблон заголовка с переменными {{var}}';
COMMENT ON COLUMN notification_templates.body_template IS 'Шаблон тела уведомления с переменными {{var}}';
