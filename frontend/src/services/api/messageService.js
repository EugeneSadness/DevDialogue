// Message Service - для работы с микросервисом сообщений
import { apiClient } from './config';

class MessageService {
    // Получить список чатов пользователя
    async getUserChats() {
        try {
            console.log('MessageService: Получение списка чатов');
            
            const response = await apiClient.get('/api/chats');
            
            return {
                success: true,
                chats: response.data
            };

        } catch (error) {
            console.error('MessageService: Ошибка получения чатов', error);
            
            return {
                success: false,
                error: error.response?.data?.message || error.message,
                chats: []
            };
        }
    }

    // Создать новый чат
    async createChat(chatData) {
        try {
            console.log('MessageService: Создание чата', chatData);
            
            const response = await apiClient.post('/api/chats', {
                title: chatData.title,
                participants: chatData.participants || []
            });
            
            return {
                success: true,
                chat: response.data
            };

        } catch (error) {
            console.error('MessageService: Ошибка создания чата', error);
            
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // Получить сообщения из чата с пагинацией
    async getMessages(chatId, page = 0, limit = 30) {
        try {
            console.log('MessageService: Получение сообщений', { chatId, page, limit });
            
            const response = await apiClient.get('/api/messages', {
                params: {
                    chatId,
                    page,
                    limit
                }
            });
            
            return {
                success: true,
                messages: response.data.messages || [],
                pagination: response.data.pagination || {
                    page,
                    limit,
                    total: 0,
                    hasMore: false
                }
            };

        } catch (error) {
            console.error('MessageService: Ошибка получения сообщений', error);
            
            return {
                success: false,
                error: error.response?.data?.message || error.message,
                messages: [],
                pagination: {
                    page,
                    limit,
                    total: 0,
                    hasMore: false
                }
            };
        }
    }

    // Отправить сообщение
    async sendMessage(messageData) {
        try {
            console.log('MessageService: Отправка сообщения', messageData);
            
            const response = await apiClient.post('/api/messages', {
                chatId: messageData.chatId,
                content: messageData.content,
                senderId: messageData.senderId
            });
            
            return {
                success: true,
                message: response.data
            };

        } catch (error) {
            console.error('MessageService: Ошибка отправки сообщения', error);
            
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // Найти пользователя по имени
    async findUserByName(name) {
        try {
            console.log('MessageService: Поиск пользователя', name);
            
            const response = await apiClient.get('/api/users/search', {
                params: { name }
            });
            
            return {
                success: true,
                user: response.data
            };

        } catch (error) {
            console.error('MessageService: Ошибка поиска пользователя', error);
            
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // Добавить пользователя в чат
    async addUserToChat(chatId, userId, inviterId) {
        try {
            console.log('MessageService: Добавление пользователя в чат', { chatId, userId, inviterId });
            
            const response = await apiClient.post('/api/chats/participants', {
                chatId,
                userId,
                inviterId
            });
            
            return {
                success: true,
                data: response.data
            };

        } catch (error) {
            console.error('MessageService: Ошибка добавления пользователя в чат', error);
            
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // Получить информацию о чате
    async getChatInfo(chatId) {
        try {
            console.log('MessageService: Получение информации о чате', chatId);
            
            const response = await apiClient.get(`/api/chats/${chatId}`);
            
            return {
                success: true,
                chat: response.data
            };

        } catch (error) {
            console.error('MessageService: Ошибка получения информации о чате', error);
            
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }
}

export default new MessageService();
