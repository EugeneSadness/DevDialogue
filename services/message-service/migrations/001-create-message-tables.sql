-- Migration: Create message service tables
-- Version: 001
-- Description: Initial tables for message service

-- Таблица чатов
CREATE TABLE IF NOT EXISTS chats (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    description TEXT,
    chat_type VARCHAR(20) DEFAULT 'private', -- private, group, channel
    created_by INTEGER NOT NULL, -- user_id из auth_db
    avatar_url VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица участников чатов
CREATE TABLE IF NOT EXISTS chat_members (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL, -- user_id из auth_db
    role VARCHAR(20) DEFAULT 'member', -- admin, moderator, member
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(chat_id, user_id)
);

-- Таблица сообщений
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL, -- user_id из auth_db
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- text, image, file, system
    reply_to INTEGER REFERENCES messages(id),
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица файлов
CREATE TABLE IF NOT EXISTS files (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_by INTEGER NOT NULL, -- user_id из auth_db
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Связь сообщений с файлами
CREATE TABLE IF NOT EXISTS message_files (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
    file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
    UNIQUE(message_id, file_id)
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_chats_created_by ON chats(created_by);
CREATE INDEX IF NOT EXISTS idx_chats_chat_type ON chats(chat_type);
CREATE INDEX IF NOT EXISTS idx_chats_is_active ON chats(is_active);
CREATE INDEX IF NOT EXISTS idx_chat_members_chat_id ON chat_members(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_user_id ON chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_is_active ON chat_members(is_active);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_is_deleted ON messages(is_deleted);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
CREATE INDEX IF NOT EXISTS idx_message_files_message_id ON message_files(message_id);
CREATE INDEX IF NOT EXISTS idx_message_files_file_id ON message_files(file_id);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_chats_updated_at 
    BEFORE UPDATE ON chats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Триггер для автоматического обновления edited_at при редактировании сообщения
CREATE OR REPLACE FUNCTION update_message_edited_at()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.content != NEW.content THEN
        NEW.is_edited = true;
        NEW.edited_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_message_edited_at_trigger
    BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_message_edited_at();

-- Комментарии к таблицам
COMMENT ON TABLE chats IS 'Таблица чатов (приватные, групповые, каналы)';
COMMENT ON TABLE chat_members IS 'Участники чатов с ролями';
COMMENT ON TABLE messages IS 'Сообщения в чатах';
COMMENT ON TABLE files IS 'Файлы, загруженные пользователями';
COMMENT ON TABLE message_files IS 'Связь сообщений с файлами';

-- Комментарии к колонкам
COMMENT ON COLUMN chats.chat_type IS 'Тип чата: private, group, channel';
COMMENT ON COLUMN chats.created_by IS 'ID пользователя-создателя из auth_db';
COMMENT ON COLUMN chat_members.role IS 'Роль в чате: admin, moderator, member';
COMMENT ON COLUMN messages.message_type IS 'Тип сообщения: text, image, file, system';
COMMENT ON COLUMN messages.reply_to IS 'ID сообщения, на которое отвечаем';
COMMENT ON COLUMN files.file_size IS 'Размер файла в байтах';
COMMENT ON COLUMN files.uploaded_by IS 'ID пользователя-загрузчика из auth_db';
