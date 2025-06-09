const { Server } = require("socket.io");
const messageHandler = require("./handlers/messageHandler.js");

// In-memory кэш для статусов пользователей (заменяет Redis)
const userStatusCache = new Map();
const onlineUsers = new Set();

// Функции для работы со статусами пользователей (заменяют Redis функции)
function setUserOnline(userId) {
    onlineUsers.add(userId);
    userStatusCache.set(userId, { isOnline: true, lastActive: Date.now() });
}

function setUserOffline(userId) {
    onlineUsers.delete(userId);
    userStatusCache.set(userId, { isOnline: false, lastActive: Date.now() });
}

function getOnlineUsers() {
    return Array.from(onlineUsers);
}

function batchUpdateUserStatuses(updates) {
    updates.forEach(update => {
        if (update.isOnline) {
            setUserOnline(update.userId);
        } else {
            setUserOffline(update.userId);
        }
    });
}

// Максимальное количество пользователей в пакете для обновления статусов
const USER_STATUS_BATCH_SIZE = 50;

// Функция для батчинга обновлений статусов пользователей
async function processBatchedStatusUpdates() {
  // Копируем текущий кэш и очищаем его для новых обновлений
  const updates = Array.from(userStatusCache.entries())
    .map(([userId, {isOnline, ttl}]) => ({userId, isOnline, ttl}));
  
  userStatusCache.clear();
  
  if (updates.length === 0) return;
  
  // Обрабатываем обновления пакетами
  for (let i = 0; i < updates.length; i += USER_STATUS_BATCH_SIZE) {
    const batch = updates.slice(i, i + USER_STATUS_BATCH_SIZE);
    await batchUpdateUserStatuses(batch);
  }
}

// Запускаем обработку батча каждые 2 секунды
setInterval(processBatchedStatusUpdates, 2000);

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    // Оптимизации Socket.IO
    pingTimeout: 30000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
    // Проверка источника сообщений
    allowRequest: (req, callback) => {
      // Здесь можно добавить дополнительную проверку запросов
      callback(null, true);
    },
    // Конфигурация для улучшения производительности
    perMessageDeflate: {
      threshold: 1024, // Сжимать сообщения больше 1KB
      zlibDeflateOptions: {
        level: 6, // Уровень сжатия (0-9, где 9 - максимальное сжатие)
        memLevel: 8 // Использование памяти (1-9, где 9 - максимальное)
      }
    }
  });

  // Буфер для пакетной отправки сообщений
  const messageBuffer = new Map();
  
  // Функция для отправки буферизованных сообщений
  function flushMessageBuffer() {
    messageBuffer.forEach((messages, roomId) => {
      if (messages.length > 0) {
        io.to(roomId).emit('batch_messages', messages);
        messageBuffer.set(roomId, []);
      }
    });
  }
  
  // Отправляем буферизованные сообщения каждые 100мс
  setInterval(flushMessageBuffer, 100);

  io.on("connection", (socket) => {
    console.log("A user connected with ID:", socket.id);
    
    // Ограничиваем количество событий, которые пользователь может вызвать
    const eventRateLimiter = new Map();
    
    // Middleware для ограничения частоты событий
    socket.use((packet, next) => {
      const eventName = packet[0];
      const now = Date.now();
      const lastTriggerTime = eventRateLimiter.get(eventName) || 0;
      
      // Минимальный интервал между событиями - 50мс
      if (now - lastTriggerTime < 50) {
        // Слишком частые запросы
        return next(new Error('Rate limited'));
      }
      
      eventRateLimiter.set(eventName, now);
      next();
    });
    
    // Устанавливаем обработчик получения информации о пользователе при подключении
    socket.on("user_connected", (userData) => {
      if (userData && userData.userId) {
        try {
          // Сохраняем ID пользователя в объекте сокета для дальнейшего использования
          socket.userId = userData.userId;
          
          // Добавляем в кэш для пакетной обработки
          userStatusCache.set(userData.userId, {isOnline: true, ttl: 300});
          
          // Присоединяем сокет к комнате по ID пользователя для персональных уведомлений
          socket.join(`user:${userData.userId}`);
          
          console.log(`Пользователь ${userData.userId} подключился`);
          
          // Оповещаем всех клиентов о новом пользователе онлайн
          io.emit("user_status_changed", { 
            userId: userData.userId, 
            status: "online" 
          });
        } catch (error) {
          console.error(`Ошибка при обработке подключения пользователя ${userData.userId}:`, error);
        }
      }
    });
    
    // Обработчик запроса списка пользователей онлайн
    socket.on("get_online_users", async (callback) => {
      try {
        const onlineUsers = await getOnlineUsers();
        if (typeof callback === 'function') {
          callback(onlineUsers);
        } else {
          socket.emit("online_users_list", onlineUsers);
        }
      } catch (error) {
        console.error("Ошибка при получении списка пользователей онлайн:", error);
        if (typeof callback === 'function') {
          callback([]);
        } else {
          socket.emit("online_users_list", []);
        }
      }
    });

    socket.on("chatMessage", (msg) => {
      // Обновляем статус онлайн при каждом сообщении
      if (socket.userId) {
        userStatusCache.set(socket.userId, {isOnline: true, ttl: 300});
      }
      
      messageHandler.handleMessage(io, msg);
    });

    socket.on("joinRoom", (data) => {
      messageHandler.handleJoinRoom(socket, data);
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected with ID:", socket.id);
      
      // Если сохранен ID пользователя, устанавливаем его как оффлайн
      if (socket.userId) {
        try {
          // Добавляем в кэш для пакетной обработки
          userStatusCache.set(socket.userId, {isOnline: false});
          
          console.log(`Пользователь ${socket.userId} установлен как оффлайн`);
          
          // Оповещаем всех клиентов об изменении статуса пользователя
          io.emit("user_status_changed", { 
            userId: socket.userId, 
            status: "offline" 
          });
        } catch (error) {
          console.error(`Ошибка при обработке отключения пользователя ${socket.userId}:`, error);
        }
      }
    });
  });

  return io;
}

module.exports = setupSocket;
