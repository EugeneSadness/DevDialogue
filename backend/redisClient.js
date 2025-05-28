const { createClient } = require('redis');

// Глобальная переменная для хранения соединения с Redis
let clientInstance = null;

// Переменная для проверки, отключен ли Redis
const isRedisDisabled = process.env.DISABLE_REDIS === 'true';

// In-memory хранилище для тестирования без Redis
const inMemoryStore = {
  keyValueStore: new Map(),
  lists: new Map(),
  sets: new Map(),
  expirations: new Map()
};

// Проверка наличия ключа с учетом истечения срока
function checkExpiration(key) {
  const expireTime = inMemoryStore.expirations.get(key);
  if (expireTime && expireTime < Date.now()) {
    // Удаляем просроченные данные
    inMemoryStore.keyValueStore.delete(key);
    inMemoryStore.lists.delete(key);
    inMemoryStore.sets.delete(key);
    inMemoryStore.expirations.delete(key);
    return false;
  }
  return true;
}

// In-memory клиент для тестирования без Redis
const inMemoryClient = {
  connect: async () => { 
    console.log('Используется in-memory хранилище вместо Redis'); 
    return true; 
  },
  
  set: async (key, value, options = {}) => {
    inMemoryStore.keyValueStore.set(key, value);
    
    // Обработка истечения срока
    if (options.EX) {
      const expireTime = Date.now() + (options.EX * 1000);
      inMemoryStore.expirations.set(key, expireTime);
    }
    
    return 'OK';
  },
  
  get: async (key) => {
    if (!checkExpiration(key)) return null;
    return inMemoryStore.keyValueStore.get(key);
  },
  
  del: async (key) => {
    const result = inMemoryStore.keyValueStore.delete(key) || 
                   inMemoryStore.lists.delete(key) || 
                   inMemoryStore.sets.delete(key);
    inMemoryStore.expirations.delete(key);
    return result ? 1 : 0;
  },
  
  lPush: async (key, value) => {
    if (!inMemoryStore.lists.has(key)) {
      inMemoryStore.lists.set(key, []);
    }
    const list = inMemoryStore.lists.get(key);
    list.unshift(value);
    return list.length;
  },
  
  lRange: async (key, start, end) => {
    if (!checkExpiration(key)) return [];
    
    const list = inMemoryStore.lists.get(key) || [];
    // Обработка отрицательных индексов
    const startIdx = start < 0 ? list.length + start : start;
    let endIdx = end < 0 ? list.length + end : end;
    
    // Приведение индекса end к длине массива, если он больше
    if (endIdx >= list.length) endIdx = list.length - 1;
    
    return list.slice(startIdx, endIdx + 1);
  },
  
  lTrim: async (key, start, end) => {
    if (!checkExpiration(key)) return 'OK';
    
    const list = inMemoryStore.lists.get(key) || [];
    // Обработка отрицательных индексов
    const startIdx = start < 0 ? list.length + start : start;
    let endIdx = end < 0 ? list.length + end : end;
    
    // Приведение индекса end к длине массива, если он больше
    if (endIdx >= list.length) endIdx = list.length - 1;
    
    const newList = list.slice(startIdx, endIdx + 1);
    inMemoryStore.lists.set(key, newList);
    
    return 'OK';
  },
  
  sAdd: async (key, ...members) => {
    if (!inMemoryStore.sets.has(key)) {
      inMemoryStore.sets.set(key, new Set());
    }
    const set = inMemoryStore.sets.get(key);
    let count = 0;
    
    for (const member of members) {
      const beforeSize = set.size;
      set.add(member);
      if (set.size > beforeSize) count++;
    }
    
    return count;
  },
  
  sRem: async (key, ...members) => {
    if (!checkExpiration(key)) return 0;
    
    const set = inMemoryStore.sets.get(key);
    if (!set) return 0;
    
    let count = 0;
    for (const member of members) {
      if (set.delete(member)) count++;
    }
    
    return count;
  },
  
  sMembers: async (key) => {
    if (!checkExpiration(key)) return [];
    
    const set = inMemoryStore.sets.get(key);
    return set ? Array.from(set) : [];
  },
  
  expire: async (key, seconds) => {
    if (!inMemoryStore.keyValueStore.has(key) && 
        !inMemoryStore.lists.has(key) && 
        !inMemoryStore.sets.has(key)) {
      return 0;
    }
    
    const expireTime = Date.now() + (seconds * 1000);
    inMemoryStore.expirations.set(key, expireTime);
    return 1;
  },
  
  // Поддержка Redis пайплайна
  multi: () => {
    const commands = [];
    const results = [];
    
    return {
      set: function(key, value, options) {
        commands.push(() => inMemoryClient.set(key, value, options));
        return this;
      },
      get: function(key) {
        commands.push(() => inMemoryClient.get(key));
        return this;
      },
      del: function(key) {
        commands.push(() => inMemoryClient.del(key));
        return this;
      },
      lPush: function(key, value) {
        commands.push(() => inMemoryClient.lPush(key, value));
        return this;
      },
      lRange: function(key, start, end) {
        commands.push(() => inMemoryClient.lRange(key, start, end));
        return this;
      },
      lTrim: function(key, start, end) {
        commands.push(() => inMemoryClient.lTrim(key, start, end));
        return this;
      },
      sAdd: function(key, ...members) {
        commands.push(() => inMemoryClient.sAdd(key, ...members));
        return this;
      },
      sRem: function(key, ...members) {
        commands.push(() => inMemoryClient.sRem(key, ...members));
        return this;
      },
      sMembers: function(key) {
        commands.push(() => inMemoryClient.sMembers(key));
        return this;
      },
      expire: function(key, seconds) {
        commands.push(() => inMemoryClient.expire(key, seconds));
        return this;
      },
      incr: function(key) {
        commands.push(async () => {
          const value = parseInt(await inMemoryClient.get(key) || '0', 10);
          const newValue = (value + 1).toString();
          await inMemoryClient.set(key, newValue);
          return newValue;
        });
        return this;
      },
      incrBy: function(key, increment) {
        commands.push(async () => {
          const value = parseInt(await inMemoryClient.get(key) || '0', 10);
          const newValue = (value + increment).toString();
          await inMemoryClient.set(key, newValue);
          return newValue;
        });
        return this;
      },
      exec: async function() {
        for (const cmd of commands) {
          results.push(await cmd());
        }
        return results;
      }
    };
  }
};

// Создаем Redis-клиент синглтон для повторного использования
async function getRedisClient() {
  if (isRedisDisabled) {
    console.log('Redis отключен. Используется in-memory хранилище.');
    return inMemoryClient;
  }
  
  if (!clientInstance) {
    clientInstance = createClient({
      url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
      socket: {
        // Уменьшаем время ожидания для операций Redis
        connectTimeout: 2000,
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000) // Экспоненциальная задержка с ограничением
      }
    });

    clientInstance.on('error', (err) => {
      console.error('Ошибка подключения к Redis:', err);
    });

    await clientInstance.connect();
    console.log('Успешное подключение к Redis');
  }
  return clientInstance;
}

// Инициализируем соединение
(async () => {
  try {
    await getRedisClient();
  } catch (err) {
    console.error('Не удалось подключиться к Redis:', err);
  }
})();

// Срок хранения истории сообщений в кэше (7 дней)
const MESSAGE_CACHE_TTL = 60 * 60 * 24 * 7;

// Максимальное количество сообщений для хранения в кэше чата
const MAX_CACHED_MESSAGES = 100;

/**
 * Пакетная обработка операций с сообщениями для одного чата
 * @param {number} chatId - ID чата
 * @param {Object} message - Объект сообщения для кэширования
 */
async function cacheChatMessageBatch(chatId, message) {
  try {
    const client = await getRedisClient();
    const pipeline = client.multi();
    const messageJson = JSON.stringify(message);
    const chatKey = `chat:${chatId}:messages`;
    
    // Последнее сообщение чата
    pipeline.set(`chat:${chatId}:lastMessage`, messageJson);
    
    // Добавляем в историю сообщений
    pipeline.lPush(chatKey, messageJson);
    pipeline.lTrim(chatKey, 0, MAX_CACHED_MESSAGES - 1);
    pipeline.expire(chatKey, MESSAGE_CACHE_TTL);
    
    await pipeline.exec();
    console.log(`Операции кэширования для чата ${chatId} выполнены пакетно`);
  } catch (error) {
    console.error(`Ошибка при пакетном кэшировании сообщения для чата ${chatId}:`, error);
  }
}

/**
 * Сохраняет последнее сообщение чата
 * @param {number} chatId - ID чата
 * @param {Object} message - Объект сообщения
 */
async function cacheLastMessage(chatId, message) {
  try {
    const client = await getRedisClient();
    await client.set(`chat:${chatId}:lastMessage`, JSON.stringify(message));
  } catch (error) {
    console.error(`Ошибка при сохранении последнего сообщения чата ${chatId}:`, error);
  }
}

/**
 * Добавляет сообщение в историю чата
 * @param {number} chatId - ID чата
 * @param {Object} message - Объект сообщения
 */
async function addMessageToHistory(chatId, message) {
  try {
    // Используем пакетное кэширование вместо отдельных операций
    return await cacheChatMessageBatch(chatId, message);
  } catch (error) {
    console.error(`Ошибка при добавлении сообщения в историю чата ${chatId}:`, error);
  }
}

/**
 * Получает историю сообщений чата из кэша с использованием пайплайна
 * @param {number} chatId - ID чата
 * @param {number} start - Начальный индекс
 * @param {number} end - Конечный индекс
 * @returns {Array} - Массив сообщений
 */
async function getCachedChatHistory(chatId, start = 0, end = MAX_CACHED_MESSAGES - 1) {
  try {
    const client = await getRedisClient();
    const key = `chat:${chatId}:messages`;
    
    // Используем один pipelined запрос вместо нескольких
    const pipeline = client.multi();
    pipeline.lRange(key, start, end);
    pipeline.expire(key, MESSAGE_CACHE_TTL); // Обновляем TTL при чтении
    
    const results = await pipeline.exec();
    const messagesJson = results[0];
    
    if (!messagesJson || messagesJson.length === 0) {
      return null;
    }
    
    // Оптимизация: парсим JSON только если есть данные
    return messagesJson.map(json => {
      try {
        return JSON.parse(json);
      } catch (e) {
        console.error('Ошибка при разборе JSON сообщения:', e);
        return null;
      }
    }).filter(msg => msg !== null);
  } catch (error) {
    console.error(`Ошибка при получении истории чата ${chatId} из Redis:`, error);
    return null;
  }
}

/**
 * Очищает историю сообщений чата в кэше
 * @param {number} chatId - ID чата
 */
async function clearChatHistory(chatId) {
  try {
    const client = await getRedisClient();
    await client.del(`chat:${chatId}:messages`);
    console.log(`История чата ${chatId} очищена в Redis`);
  } catch (error) {
    console.error(`Ошибка при очистке истории чата ${chatId} в Redis:`, error);
  }
}

/**
 * Пакетно обновляет статусы пользователей (до 50 пользователей за раз)
 * @param {Array<Object>} userStatusUpdates - Массив объектов {userId, isOnline, ttl}
 */
async function batchUpdateUserStatuses(userStatusUpdates) {
  if (!userStatusUpdates || userStatusUpdates.length === 0) return;
  
  try {
    const client = await getRedisClient();
    const pipeline = client.multi();
    const now = new Date().toISOString();
    
    for (const update of userStatusUpdates) {
      const { userId, isOnline, ttl = 300 } = update;
      
      if (isOnline) {
        // Добавляем в сет онлайн-пользователей
        pipeline.sAdd('online:users', userId.toString());
        pipeline.set(`user:${userId}:online`, '1', { EX: ttl });
        pipeline.set(`user:${userId}:lastActive`, now);
      } else {
        // Удаляем из сета онлайн-пользователей
        pipeline.sRem('online:users', userId.toString());
        pipeline.del(`user:${userId}:online`);
      }
    }
    
    await pipeline.exec();
  } catch (error) {
    console.error('Ошибка при пакетном обновлении статусов пользователей:', error);
  }
}

/**
 * Устанавливает пользователя как онлайн
 * @param {number} userId - ID пользователя
 * @param {number} ttl - Время жизни статуса в секундах (по умолчанию 5 минут)
 */
async function setUserOnline(userId, ttl = 300) {
  try {
    await batchUpdateUserStatuses([{ userId, isOnline: true, ttl }]);
  } catch (error) {
    console.error(`Ошибка при установке статуса онлайн для пользователя ${userId}:`, error);
  }
}

/**
 * Проверяет, онлайн ли пользователь
 * @param {number} userId - ID пользователя
 * @returns {boolean} - true если пользователь онлайн, иначе false
 */
async function isUserOnline(userId) {
  try {
    const client = await getRedisClient();
    const status = await client.get(`user:${userId}:online`);
    return status === '1';
  } catch (error) {
    console.error(`Ошибка при проверке статуса пользователя ${userId}:`, error);
    return false;
  }
}

/**
 * Получает список онлайн пользователей
 * @returns {Array<string>} - Массив ID пользователей онлайн
 */
async function getOnlineUsers() {
  try {
    const client = await getRedisClient();
    return await client.sMembers('online:users');
  } catch (error) {
    console.error('Ошибка при получении списка онлайн пользователей:', error);
    return [];
  }
}

/**
 * Устанавливает пользователя как оффлайн
 * @param {number} userId - ID пользователя
 */
async function setUserOffline(userId) {
  try {
    await batchUpdateUserStatuses([{ userId, isOnline: false }]);
  } catch (error) {
    console.error(`Ошибка при установке статуса оффлайн для пользователя ${userId}:`, error);
  }
}

/**
 * Получает время последней активности пользователя
 * @param {number} userId - ID пользователя
 * @returns {string|null} - ISO строка с датой последней активности или null
 */
async function getUserLastActive(userId) {
  try {
    const client = await getRedisClient();
    return await client.get(`user:${userId}:lastActive`);
  } catch (error) {
    console.error(`Ошибка при получении времени последней активности пользователя ${userId}:`, error);
    return null;
  }
}

/**
 * Пакетная обработка счетчиков непрочитанных сообщений
 * @param {Array<Object>} updates - Массив обновлений {userId, chatId, count}
 */
async function batchUpdateUnreadCounts(updates) {
  if (!updates || updates.length === 0) return;
  
  try {
    const client = await getRedisClient();
    const pipeline = client.multi();
    
    for (const update of updates) {
      const { userId, chatId, count } = update;
      const key = `unread:${userId}:${chatId}`;
      
      if (count === 0) {
        pipeline.set(key, 0);
      } else {
        pipeline.incrBy(key, count);
      }
    }
    
    const results = await pipeline.exec();
    return results;
  } catch (error) {
    console.error('Ошибка при пакетном обновлении счетчиков непрочитанных сообщений:', error);
    return [];
  }
}

/**
 * Увеличивает счетчик непрочитанных сообщений для пользователя в определенном чате
 * @param {string} userId ID пользователя
 * @param {string} chatId ID чата
 * @returns {Promise<number>} Новое количество непрочитанных сообщений
 */
async function incrementUnreadMessages(userId, chatId) {
  try {
    const results = await batchUpdateUnreadCounts([{ userId, chatId, count: 1 }]);
    return parseInt(results[0]) || 0;
  } catch (error) {
    console.error(`Ошибка при инкременте непрочитанных сообщений для ${userId} в чате ${chatId}:`, error);
    return 0;
  }
}

/**
 * Сбрасывает счетчик непрочитанных сообщений для пользователя в определенном чате
 * @param {string} userId ID пользователя
 * @param {string} chatId ID чата
 * @returns {Promise<number>} Всегда возвращает 0 при успехе
 */
async function resetUnreadMessages(userId, chatId) {
  try {
    await batchUpdateUnreadCounts([{ userId, chatId, count: 0 }]);
    return 0;
  } catch (error) {
    console.error(`Ошибка при сбросе непрочитанных сообщений для ${userId} в чате ${chatId}:`, error);
    return 0;
  }
}

/**
 * Получает количество непрочитанных сообщений для пользователя в определенном чате
 * @param {number} userId - ID пользователя
 * @param {number} chatId - ID чата
 * @returns {number} - Количество непрочитанных сообщений
 */
async function getUnreadMessagesCount(userId, chatId) {
  try {
    const client = await getRedisClient();
    const count = await client.get(`unread:${userId}:${chatId}`);
    return parseInt(count) || 0;
  } catch (error) {
    console.error(`Ошибка при получении непрочитанных сообщений для пользователя ${userId} в чате ${chatId}:`, error);
    return 0;
  }
}

/**
 * Получает все непрочитанные сообщения пользователя по всем чатам
 * @param {number} userId - ID пользователя
 * @returns {Object} - Объект с ID чатов и количеством непрочитанных сообщений
 */
async function getAllUnreadMessages(userId) {
  try {
    const client = await getRedisClient();
    const pattern = `unread:${userId}:*`;
    const keys = await client.keys(pattern);
    
    if (!keys || keys.length === 0) {
      return {};
    }
    
    // Получаем все значения за один запрос
    const pipeline = client.multi();
    for (const key of keys) {
      pipeline.get(key);
    }
    
    const values = await pipeline.exec();
    
    // Создаем объект результата
    const result = {};
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const chatId = key.split(':')[2];
      result[chatId] = parseInt(values[i]) || 0;
    }
    
    return result;
  } catch (error) {
    console.error(`Ошибка при получении всех непрочитанных сообщений для пользователя ${userId}:`, error);
    return {};
  }
}

module.exports = {
  getRedisClient,
  cacheLastMessage,
  addMessageToHistory,
  getCachedChatHistory,
  clearChatHistory,
  setUserOnline,
  isUserOnline,
  getOnlineUsers,
  setUserOffline,
  getUserLastActive,
  incrementUnreadMessages,
  getUnreadMessagesCount,
  getAllUnreadMessages,
  resetUnreadMessages,
  batchUpdateUserStatuses,
  batchUpdateUnreadCounts,
  cacheChatMessageBatch
}; 