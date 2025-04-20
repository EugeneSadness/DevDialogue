const { createClient } = require('redis');

const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

redisClient.on('error', (err) => {
  console.error('Ошибка подключения к Redis:', err);
});

(async () => {
  try {
    await redisClient.connect();
    console.log('Успешное подключение к Redis');
  } catch (err) {
    console.error('Не удалось подключиться к Redis:', err);
  }
})();

module.exports = redisClient; 