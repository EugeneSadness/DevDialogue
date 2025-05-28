const io = require('socket.io-client');

const socket = io('http://localhost:4000');  // подключаемся к бэкенду

// Обработчик подключения
socket.on('connect', () => {
  console.log('Подключено к серверу');
  
  // Отправляем тестовое сообщение
  const testMessage = {
    content: 'Тестовое сообщение для Redis ' + Date.now(),
    senderId: 7,  // ID пользователя, который доступен в системе
    chatId: 7,    // ID чата, который доступен в системе
    username: 'testuser',
    email: 'test@example.com'
  };
  
  console.log('Отправка тестового сообщения:', testMessage);
  socket.emit('chatMessage', testMessage);
});

// Обработчик для получения сообщений
socket.on('chatMessage', (msg) => {
  console.log('Получено сообщение от сервера:', msg);
});

// Обработчик ошибок
socket.on('error', (error) => {
  console.error('Ошибка socket.io:', error);
});

// Закрываем соединение через 5 секунд
setTimeout(() => {
  console.log('Закрытие соединения');
  socket.disconnect();
  process.exit(0);
}, 5000); 