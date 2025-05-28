-- Создание пользователя для репликации
CREATE USER replica WITH REPLICATION ENCRYPTED PASSWORD 'replica_password';

-- Создание пользователя для мессенджера
CREATE USER messenger_user WITH ENCRYPTED PASSWORD 'messenger_password';

-- Создание базы данных для мессенджера
CREATE DATABASE messenger OWNER messenger_user;
CREATE DATABASE messenger_test OWNER messenger_user;

-- Предоставление прав
GRANT ALL PRIVILEGES ON DATABASE messenger TO messenger_user;
GRANT ALL PRIVILEGES ON DATABASE messenger_test TO messenger_user;
