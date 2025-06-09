-- Инициализация базы данных мессенджера для микросервисов
-- Минимальная настройка - микросервисы сами создадут свои таблицы

-- Создание расширений
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Создание пользователя для приложения
CREATE USER messenger_user WITH PASSWORD 'messenger_pass';
GRANT ALL PRIVILEGES ON DATABASE messenger TO messenger_user;

-- Предоставление прав на схему public
GRANT ALL ON SCHEMA public TO messenger_user;
GRANT CREATE ON SCHEMA public TO messenger_user;

-- Предоставление прав пользователю messenger_user на все объекты
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO messenger_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO messenger_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO messenger_user;

-- Предоставление прав на будущие объекты
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO messenger_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO messenger_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO messenger_user;

-- Сделать messenger_user владельцем схемы public (это решит проблему с правами)
ALTER SCHEMA public OWNER TO messenger_user;

COMMIT;
