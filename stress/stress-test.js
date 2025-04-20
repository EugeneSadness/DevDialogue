const io = require('socket.io-client');
const cluster = require('cluster');
const os = require('os');

// Конфигурация теста
const TEST_CONFIG = {
  serverUrl: 'http://localhost:4000',
  connectionsPerWorker: 100,      // Количество соединений на каждый воркер
  messageInterval: 2000,          // Интервал отправки сообщений в мс
  testDuration: 120000,           // Продолжительность теста в мс (2 минуты)
  rampUpPeriod: 30000,            // Период постепенного увеличения нагрузки в мс (30 секунд)
  numCPUs: os.cpus().length,      // Количество ядер CPU
  initialDelayBetweenConnections: 50 // Начальная задержка между созданием соединений (мс)
};

// Общая статистика
let totalConnections = 0;
let successfulConnections = 0;
let failedConnections = 0;
let messagesSent = 0;
let messagesReceived = 0;
let connectionErrors = 0;
let messageErrors = 0;

// Функция для создания одного соединения с определенной задержкой
const createConnection = (id, delay) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const socket = io(TEST_CONFIG.serverUrl, {
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        timeout: 5000
      });

      // Отслеживание подключения
      socket.on('connect', () => {
        console.log(`[Client ${id}] Connected`);
        successfulConnections++;
        
        // Отправка сообщений с интервалом
        const messageInterval = setInterval(() => {
          try {
            const message = {
              content: `Stress test message from client ${id} at ${Date.now()}`,
              senderId: 7,
              chatId: 7,
              username: `testuser-${id}`,
              email: `test${id}@example.com`
            };
            
            socket.emit('chatMessage', message);
            messagesSent++;
            
            if (id % 100 === 0) {
              console.log(`[Client ${id}] Sent message`);
            }
          } catch (err) {
            messageErrors++;
            console.error(`[Client ${id}] Error sending message:`, err.message);
          }
        }, TEST_CONFIG.messageInterval);
        
        // Остановка интервала после завершения теста
        setTimeout(() => {
          clearInterval(messageInterval);
          socket.disconnect();
        }, TEST_CONFIG.testDuration);
      });

      // Получение сообщений
      socket.on('chatMessage', (msg) => {
        messagesReceived++;
        if (id % 100 === 0) {
          console.log(`[Client ${id}] Received message`);
        }
      });

      // Обработка ошибок
      socket.on('connect_error', (err) => {
        connectionErrors++;
        console.error(`[Client ${id}] Connection error: ${err.message}`);
      });

      socket.on('error', (err) => {
        console.error(`[Client ${id}] Socket error: ${err.message}`);
      });

      socket.on('disconnect', (reason) => {
        console.log(`[Client ${id}] Disconnected: ${reason}`);
      });

      resolve(socket);
    }, delay);
  });
};

// Функция для мастер-процесса
const runMaster = () => {
  console.log(`Запуск стресс-теста с ${TEST_CONFIG.numCPUs} воркерами`);
  console.log(`Каждый воркер запустит ${TEST_CONFIG.connectionsPerWorker} соединений`);
  console.log(`Общее количество соединений: ${TEST_CONFIG.numCPUs * TEST_CONFIG.connectionsPerWorker}`);
  
  // Создание воркеров
  for (let i = 0; i < TEST_CONFIG.numCPUs; i++) {
    cluster.fork({ workerId: i });
  }
  
  // Сбор статистики от воркеров
  cluster.on('message', (worker, message) => {
    if (message.type === 'stats') {
      successfulConnections += message.successfulConnections;
      failedConnections += message.failedConnections;
      messagesSent += message.messagesSent;
      messagesReceived += message.messagesReceived;
      connectionErrors += message.connectionErrors;
      messageErrors += message.messageErrors;
    }
  });
  
  // Обработка завершения теста
  setTimeout(() => {
    console.log('=== Результаты стресс-теста ===');
    console.log(`Запланировано соединений: ${TEST_CONFIG.numCPUs * TEST_CONFIG.connectionsPerWorker}`);
    console.log(`Успешных соединений: ${successfulConnections}`);
    console.log(`Неудачных соединений: ${failedConnections}`);
    console.log(`Ошибок соединения: ${connectionErrors}`);
    console.log(`Отправлено сообщений: ${messagesSent}`);
    console.log(`Получено сообщений: ${messagesReceived}`);
    console.log(`Ошибок при отправке сообщений: ${messageErrors}`);
    
    // Завершаем все воркеры
    Object.values(cluster.workers).forEach(worker => {
      worker.send('stop');
    });
    
    // Завершаем мастер-процесс
    setTimeout(() => {
      console.log('Стресс-тест завершен');
      process.exit(0);
    }, 2000);
  }, TEST_CONFIG.testDuration + 5000);
};

// Функция для воркер-процесса
const runWorker = () => {
  const workerId = parseInt(process.env.workerId);
  const baseClientId = workerId * TEST_CONFIG.connectionsPerWorker;
  
  console.log(`[Worker ${workerId}] Starting with ${TEST_CONFIG.connectionsPerWorker} connections`);
  
  let workerStats = {
    successfulConnections: 0,
    failedConnections: 0,
    messagesSent: 0,
    messagesReceived: 0,
    connectionErrors: 0,
    messageErrors: 0
  };
  
  // Создание соединений с постепенным нарастанием
  const sockets = [];
  const promises = [];
  
  for (let i = 0; i < TEST_CONFIG.connectionsPerWorker; i++) {
    const clientId = baseClientId + i;
    
    // Рассчитываем задержку для постепенного добавления соединений
    // Первая половина соединений создается быстрее для быстрого набора базовой нагрузки
    // Вторая половина добавляется постепенно для наблюдения за пределом системы
    let delay;
    if (i < TEST_CONFIG.connectionsPerWorker / 2) {
      delay = i * TEST_CONFIG.initialDelayBetweenConnections;
    } else {
      delay = (TEST_CONFIG.connectionsPerWorker / 2) * TEST_CONFIG.initialDelayBetweenConnections + 
              (i - TEST_CONFIG.connectionsPerWorker / 2) * (TEST_CONFIG.rampUpPeriod / (TEST_CONFIG.connectionsPerWorker / 2));
    }
    
    // Создание соединения с рассчитанной задержкой
    promises.push(
      createConnection(clientId, delay)
        .then(socket => {
          sockets.push(socket);
          totalConnections++;
          
          // Переопределяем обработчики для сбора статистики
          socket.on('connect', () => {
            workerStats.successfulConnections++;
          });
          
          socket.on('connect_error', () => {
            workerStats.connectionErrors++;
          });
          
          socket.on('error', () => {
            workerStats.failedConnections++;
          });
          
          socket.on('chatMessage', () => {
            workerStats.messagesReceived++;
          });
          
          // Оригинальный интервал отправки сообщений
          const messageInterval = setInterval(() => {
            try {
              const message = {
                content: `Stress test message from client ${clientId} at ${Date.now()}`,
                senderId: 7,
                chatId: 7,
                username: `testuser-${clientId}`,
                email: `test${clientId}@example.com`
              };
              
              socket.emit('chatMessage', message);
              workerStats.messagesSent++;
            } catch (err) {
              workerStats.messageErrors++;
            }
          }, TEST_CONFIG.messageInterval);
          
          // Очистка интервала при завершении теста
          setTimeout(() => {
            clearInterval(messageInterval);
          }, TEST_CONFIG.testDuration);
        })
        .catch(err => {
          console.error(`[Worker ${workerId}][Client ${clientId}] Error creating connection:`, err.message);
          workerStats.failedConnections++;
        })
    );
  }
  
  // Отправка статистики мастеру каждые 5 секунд
  const statsInterval = setInterval(() => {
    process.send({ 
      type: 'stats', 
      ...workerStats 
    });
    
    // Сбрасываем счетчики после отправки
    workerStats = {
      successfulConnections: 0,
      failedConnections: 0,
      messagesSent: 0,
      messagesReceived: 0,
      connectionErrors: 0,
      messageErrors: 0
    };
  }, 5000);
  
  // Обработка сообщения о завершении от мастера
  process.on('message', (message) => {
    if (message === 'stop') {
      clearInterval(statsInterval);
      
      // Закрываем все соединения
      sockets.forEach(socket => {
        if (socket.connected) {
          socket.disconnect();
        }
      });
      
      // Отправляем последнюю статистику
      process.send({ 
        type: 'stats', 
        ...workerStats 
      });
      
      setTimeout(() => {
        process.exit(0);
      }, 1000);
    }
  });
};

// Точка входа программы
if (cluster.isMaster) {
  runMaster();
} else {
  runWorker();
} 