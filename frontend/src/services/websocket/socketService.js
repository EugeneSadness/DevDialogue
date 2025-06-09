// WebSocket Service - для работы с real-time сообщениями
import io from 'socket.io-client';
import { WS_BASE_URL, getAuthToken } from '../api/config';

class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectInterval = 3000;
        this.eventHandlers = new Map();
    }

    // Подключение к WebSocket серверу
    connect(options = {}) {
        try {
            console.log('SocketService: Подключение к WebSocket серверу', WS_BASE_URL);

            const token = getAuthToken();
            if (!token) {
                console.error('SocketService: Токен не найден, подключение невозможно');
                return false;
            }

            // Настройки подключения
            const socketOptions = {
                auth: {
                    token: token
                },
                transports: ['websocket', 'polling'],
                timeout: 10000,
                forceNew: true,
                ...options
            };

            // Создаем подключение
            this.socket = io(WS_BASE_URL, socketOptions);

            // Обработчики событий подключения
            this.socket.on('connect', () => {
                console.log('SocketService: Подключение установлено', this.socket.id);
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.emit('connected', { socketId: this.socket.id });
            });

            this.socket.on('disconnect', (reason) => {
                console.log('SocketService: Подключение разорвано', reason);
                this.isConnected = false;
                this.emit('disconnected', { reason });
                
                // Автоматическое переподключение
                if (reason === 'io server disconnect') {
                    // Сервер принудительно разорвал соединение, переподключаемся
                    this.reconnect();
                }
            });

            this.socket.on('connect_error', (error) => {
                console.error('SocketService: Ошибка подключения', error);
                this.isConnected = false;
                this.emit('connectionError', { error });
                this.reconnect();
            });

            this.socket.on('reconnect', (attemptNumber) => {
                console.log('SocketService: Переподключение успешно', attemptNumber);
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.emit('reconnected', { attemptNumber });
            });

            this.socket.on('reconnect_error', (error) => {
                console.error('SocketService: Ошибка переподключения', error);
                this.emit('reconnectError', { error });
            });

            // Обработчики сообщений
            this.socket.on('chatMessage', (data) => {
                console.log('SocketService: Получено сообщение', data);
                this.emit('message', data);
            });

            this.socket.on('userJoined', (data) => {
                console.log('SocketService: Пользователь присоединился', data);
                this.emit('userJoined', data);
            });

            this.socket.on('userLeft', (data) => {
                console.log('SocketService: Пользователь покинул чат', data);
                this.emit('userLeft', data);
            });

            this.socket.on('typing', (data) => {
                console.log('SocketService: Пользователь печатает', data);
                this.emit('typing', data);
            });

            this.socket.on('stopTyping', (data) => {
                console.log('SocketService: Пользователь перестал печатать', data);
                this.emit('stopTyping', data);
            });

            return true;

        } catch (error) {
            console.error('SocketService: Ошибка при подключении', error);
            return false;
        }
    }

    // Переподключение
    reconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('SocketService: Превышено максимальное количество попыток переподключения');
            this.emit('maxReconnectAttemptsReached');
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(Math.pow(2, this.reconnectAttempts) * 1000, 10000);
        
        console.log(`SocketService: Попытка переподключения ${this.reconnectAttempts}/${this.maxReconnectAttempts} через ${delay}ms`);
        
        setTimeout(() => {
            if (!this.isConnected && this.socket) {
                this.socket.connect();
            }
        }, delay);
    }

    // Отключение
    disconnect() {
        console.log('SocketService: Отключение от WebSocket сервера');
        
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.eventHandlers.clear();
    }

    // Отправка сообщения
    sendMessage(messageData) {
        if (!this.isConnected || !this.socket) {
            console.error('SocketService: Нет подключения для отправки сообщения');
            return false;
        }

        try {
            console.log('SocketService: Отправка сообщения', messageData);
            this.socket.emit('chatMessage', messageData);
            return true;
        } catch (error) {
            console.error('SocketService: Ошибка отправки сообщения', error);
            return false;
        }
    }

    // Присоединение к чату
    joinChat(chatId) {
        if (!this.isConnected || !this.socket) {
            console.error('SocketService: Нет подключения для присоединения к чату');
            return false;
        }

        try {
            console.log('SocketService: Присоединение к чату', chatId);
            this.socket.emit('joinChat', { chatId });
            return true;
        } catch (error) {
            console.error('SocketService: Ошибка присоединения к чату', error);
            return false;
        }
    }

    // Покидание чата
    leaveChat(chatId) {
        if (!this.isConnected || !this.socket) {
            console.error('SocketService: Нет подключения для покидания чата');
            return false;
        }

        try {
            console.log('SocketService: Покидание чата', chatId);
            this.socket.emit('leaveChat', { chatId });
            return true;
        } catch (error) {
            console.error('SocketService: Ошибка покидания чата', error);
            return false;
        }
    }

    // Индикатор печати
    startTyping(chatId) {
        if (!this.isConnected || !this.socket) return false;

        try {
            this.socket.emit('typing', { chatId });
            return true;
        } catch (error) {
            console.error('SocketService: Ошибка отправки индикатора печати', error);
            return false;
        }
    }

    stopTyping(chatId) {
        if (!this.isConnected || !this.socket) return false;

        try {
            this.socket.emit('stopTyping', { chatId });
            return true;
        } catch (error) {
            console.error('SocketService: Ошибка остановки индикатора печати', error);
            return false;
        }
    }

    // Подписка на события
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event).add(handler);
    }

    // Отписка от событий
    off(event, handler) {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).delete(handler);
        }
    }

    // Эмиссия событий
    emit(event, data) {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`SocketService: Ошибка в обработчике события ${event}`, error);
                }
            });
        }
    }

    // Проверка состояния подключения
    isSocketConnected() {
        return this.isConnected && this.socket && this.socket.connected;
    }

    // Получение ID сокета
    getSocketId() {
        return this.socket ? this.socket.id : null;
    }
}

export default new SocketService();
