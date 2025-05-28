const express = require("express");
const http = require("http");
const sequelizePromise = require("./db.js");
const cors = require("cors");
const router = require("./routes/index");
const errorHandler = require("./middleware/ErrorHandlingMiddleware.js");
const setupSocket = require("./socket/index.js");
const Models = require("./models/models");
const compression = require('compression');
require("dotenv").config();

const PORT = process.env.PORT || 4000;

const app = express();

// Включаем сжатие ответов для экономии трафика
app.use(compression());

// Оптимизация JSON-парсинга с ограничениями для защиты от DoS
app.use(express.json({ limit: '500kb' }));

// Поддержка URL-encoded данных форм с ограничениями
app.use(express.urlencoded({ extended: true, limit: '500kb' }));

app.use(cors());

// Кэширование статических ресурсов
app.use('/static', express.static('static', {
  maxAge: '1d', // кэш на 1 день
  etag: true,
  lastModified: true
}));

// Отключаем заголовок X-Powered-By для безопасности
app.disable('x-powered-by');

// Устанавливаем заголовки для повышения безопасности
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

// Используем кэш-контроль для API-ответов
app.use('/api', (req, res, next) => {
  // Кэширование разрешено только для GET-запросов
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'private, max-age=10'); // 10 секунд для GET
  } else {
    res.setHeader('Cache-Control', 'no-store'); // Запрет кэширования для POST, PUT, DELETE
  }
  next();
});

app.use('/api', router);

// Обработчик ошибок как последний middleware
app.use(errorHandler);

const httpServer = http.createServer(app);

const io = setupSocket(httpServer);

// Базовый маршрут с минимальной нагрузкой на сервер
app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is working!" });
});

// Маршрут для проверки здоровья системы
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

async function startServer() {
  try {
    // Инициализация базы данных
    const sequelize = await sequelizePromise;
    await sequelize.authenticate();
    await sequelize.sync();
    
    // Увеличиваем количество одновременных соединений
    httpServer.maxConnections = 1000;
    
    // Увеличиваем таймаут ожидания для предотвращения закрытия долгих соединений
    httpServer.keepAliveTimeout = 65000; // 65 секунд
    
    // Увеличиваем таймаут заголовков
    httpServer.headersTimeout = 66000; // 66 секунд
    
    // Оптимизация TCP сокетов
    httpServer.on('connection', (socket) => {
      // Отключаем алгоритм Нагла для уменьшения задержки
      socket.setNoDelay(true);
      
      // Устанавливаем keepalive
      socket.setKeepAlive(true, 30000); // 30 секунд
    });
    
    // Запускаем сервер
    httpServer.listen(PORT, () => {
      console.log(`Server was started on port ${PORT}`);
    });
  } catch (e) {
    console.error("Failed to start server:", e);
    process.exit(1); // Exit the process with an error code
  }
}

startServer();
