#!/bin/bash

# Скрипт для создания Dockerfile для Node.js сервиса мессенджера
# Основан на инструкциях из diploma/screenshots.md, раздел 2.2

set -e

echo "=== Создание Dockerfile для Node.js сервиса мессенджера ==="

# Создаем директорию для проекта, если её нет
mkdir -p messenger-service
cd messenger-service

# Создаем Dockerfile
echo "Создание Dockerfile..."
cat > Dockerfile << 'EOF'
FROM node:16-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Открываем порт 3000
EXPOSE 3000

# Запускаем приложение
CMD ["node", "server.js"]
EOF

# Создаем пример package.json
echo "Создание package.json..."
cat > package.json << 'EOF'
{
  "name": "messenger-service",
  "version": "1.0.0",
  "description": "Сервис мессенджера для дипломного проекта",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.7.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.6.2"
  },
  "keywords": ["messenger", "nodejs", "express", "socket.io"],
  "author": "Diploma Project",
  "license": "MIT"
}
EOF

# Создаем простой server.js
echo "Создание server.js..."
cat > server.js << 'EOF'
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Основные маршруты
app.get('/', (req, res) => {
  res.json({ message: 'Messenger API работает!', version: '1.0.0' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.IO для реального времени
io.on('connection', (socket) => {
  console.log('Пользователь подключился:', socket.id);
  
  socket.on('message', (data) => {
    console.log('Получено сообщение:', data);
    io.emit('message', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Пользователь отключился:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
EOF

# Создаем .dockerignore
echo "Создание .dockerignore..."
cat > .dockerignore << 'EOF'
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.nyc_output
.coverage
.coverage/
EOF

echo "✅ Dockerfile и сопутствующие файлы созданы в директории messenger-service/"
echo ""
echo "Структура проекта:"
ls -la

echo ""
echo "Содержимое Dockerfile:"
echo "========================"
cat Dockerfile

echo ""
echo "Для сборки образа выполните:"
echo "docker build -t messenger-service:latest ."
echo ""
echo "Для запуска контейнера выполните:"
echo "docker run -p 3000:3000 messenger-service:latest"
