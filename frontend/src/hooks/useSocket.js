// Custom Hook для работы с WebSocket
import { useState, useEffect, useCallback, useRef } from 'react';
import { socketService } from '../services/api';

export const useSocket = (options = {}) => {
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(null);
    const [lastMessage, setLastMessage] = useState(null);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    
    const handlersRef = useRef(new Map());
    const didUnmount = useRef(false);

    // Подключение к сокету
    const connect = useCallback(() => {
        if (didUnmount.current) return;
        
        console.log('useSocket: Инициализация подключения');
        
        const success = socketService.connect(options);
        if (!success) {
            setConnectionError('Не удалось установить подключение');
        }
    }, [options]);

    // Отключение от сокета
    const disconnect = useCallback(() => {
        console.log('useSocket: Отключение от сокета');
        socketService.disconnect();
        setIsConnected(false);
        setConnectionError(null);
    }, []);

    // Отправка сообщения
    const sendMessage = useCallback((messageData) => {
        if (!isConnected) {
            console.warn('useSocket: Попытка отправки сообщения без подключения');
            return false;
        }
        
        return socketService.sendMessage(messageData);
    }, [isConnected]);

    // Присоединение к чату
    const joinChat = useCallback((chatId) => {
        if (!isConnected) {
            console.warn('useSocket: Попытка присоединения к чату без подключения');
            return false;
        }
        
        return socketService.joinChat(chatId);
    }, [isConnected]);

    // Покидание чата
    const leaveChat = useCallback((chatId) => {
        if (!isConnected) {
            console.warn('useSocket: Попытка покидания чата без подключения');
            return false;
        }
        
        return socketService.leaveChat(chatId);
    }, [isConnected]);

    // Индикаторы печати
    const startTyping = useCallback((chatId) => {
        if (!isConnected) return false;
        return socketService.startTyping(chatId);
    }, [isConnected]);

    const stopTyping = useCallback((chatId) => {
        if (!isConnected) return false;
        return socketService.stopTyping(chatId);
    }, [isConnected]);

    // Подписка на события
    const addEventListener = useCallback((event, handler) => {
        socketService.on(event, handler);
        
        // Сохраняем ссылку на обработчик для очистки
        if (!handlersRef.current.has(event)) {
            handlersRef.current.set(event, new Set());
        }
        handlersRef.current.get(event).add(handler);
    }, []);

    // Отписка от событий
    const removeEventListener = useCallback((event, handler) => {
        socketService.off(event, handler);
        
        if (handlersRef.current.has(event)) {
            handlersRef.current.get(event).delete(handler);
        }
    }, []);

    // Эффект для управления подключением
    useEffect(() => {
        // Обработчики событий подключения
        const handleConnected = (data) => {
            if (didUnmount.current) return;
            console.log('useSocket: Подключение установлено', data);
            setIsConnected(true);
            setConnectionError(null);
            setReconnectAttempts(0);
        };

        const handleDisconnected = (data) => {
            if (didUnmount.current) return;
            console.log('useSocket: Подключение разорвано', data);
            setIsConnected(false);
        };

        const handleConnectionError = (data) => {
            if (didUnmount.current) return;
            console.error('useSocket: Ошибка подключения', data);
            setConnectionError(data.error?.message || 'Ошибка подключения');
            setIsConnected(false);
        };

        const handleReconnected = (data) => {
            if (didUnmount.current) return;
            console.log('useSocket: Переподключение успешно', data);
            setIsConnected(true);
            setConnectionError(null);
            setReconnectAttempts(data.attemptNumber || 0);
        };

        const handleReconnectError = (data) => {
            if (didUnmount.current) return;
            console.error('useSocket: Ошибка переподключения', data);
            setReconnectAttempts(prev => prev + 1);
        };

        const handleMessage = (data) => {
            if (didUnmount.current) return;
            console.log('useSocket: Получено сообщение', data);
            setLastMessage(data);
        };

        const handleMaxReconnectAttemptsReached = () => {
            if (didUnmount.current) return;
            console.error('useSocket: Превышено максимальное количество попыток переподключения');
            setConnectionError('Не удалось восстановить подключение');
            setIsConnected(false);
        };

        // Подписываемся на события
        addEventListener('connected', handleConnected);
        addEventListener('disconnected', handleDisconnected);
        addEventListener('connectionError', handleConnectionError);
        addEventListener('reconnected', handleReconnected);
        addEventListener('reconnectError', handleReconnectError);
        addEventListener('message', handleMessage);
        addEventListener('maxReconnectAttemptsReached', handleMaxReconnectAttemptsReached);

        // Автоматическое подключение при монтировании
        if (options.autoConnect !== false) {
            connect();
        }

        // Очистка при размонтировании
        return () => {
            didUnmount.current = true;
            
            // Отписываемся от всех событий
            removeEventListener('connected', handleConnected);
            removeEventListener('disconnected', handleDisconnected);
            removeEventListener('connectionError', handleConnectionError);
            removeEventListener('reconnected', handleReconnected);
            removeEventListener('reconnectError', handleReconnectError);
            removeEventListener('message', handleMessage);
            removeEventListener('maxReconnectAttemptsReached', handleMaxReconnectAttemptsReached);
            
            // Очищаем все обработчики
            handlersRef.current.forEach((handlers, event) => {
                handlers.forEach(handler => {
                    socketService.off(event, handler);
                });
            });
            handlersRef.current.clear();
            
            // Отключаемся при размонтировании (если не указано иное)
            if (options.disconnectOnUnmount !== false) {
                disconnect();
            }
        };
    }, [connect, disconnect, addEventListener, removeEventListener, options.autoConnect, options.disconnectOnUnmount]);

    return {
        // Состояние подключения
        isConnected,
        connectionError,
        lastMessage,
        reconnectAttempts,
        
        // Методы управления подключением
        connect,
        disconnect,
        
        // Методы отправки данных
        sendMessage,
        joinChat,
        leaveChat,
        startTyping,
        stopTyping,
        
        // Методы подписки на события
        addEventListener,
        removeEventListener,
        
        // Утилиты
        getSocketId: () => socketService.getSocketId(),
        isSocketConnected: () => socketService.isSocketConnected()
    };
};

export default useSocket;
