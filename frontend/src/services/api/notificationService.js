// Notification Service - для работы с микросервисом уведомлений
import { apiClient } from './config';

class NotificationService {
    // Получить список уведомлений пользователя
    async getNotifications() {
        try {
            console.log('NotificationService: Получение уведомлений');
            
            const response = await apiClient.get('/api/notifications');
            
            return {
                success: true,
                notifications: response.data
            };

        } catch (error) {
            console.error('NotificationService: Ошибка получения уведомлений', error);
            
            return {
                success: false,
                error: error.response?.data?.message || error.message,
                notifications: []
            };
        }
    }

    // Создать подписку на push уведомления
    async createSubscription(subscriptionData) {
        try {
            console.log('NotificationService: Создание подписки на уведомления');
            
            const response = await apiClient.post('/api/subscriptions', subscriptionData);
            
            return {
                success: true,
                subscription: response.data
            };

        } catch (error) {
            console.error('NotificationService: Ошибка создания подписки', error);
            
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // Отправить уведомление
    async sendNotification(notificationData) {
        try {
            console.log('NotificationService: Отправка уведомления', notificationData);
            
            const response = await apiClient.post('/api/notifications', {
                userId: notificationData.userId,
                title: notificationData.title,
                message: notificationData.message,
                type: notificationData.type || 'info'
            });
            
            return {
                success: true,
                notification: response.data
            };

        } catch (error) {
            console.error('NotificationService: Ошибка отправки уведомления', error);
            
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // Отметить уведомление как прочитанное
    async markAsRead(notificationId) {
        try {
            console.log('NotificationService: Отметка уведомления как прочитанного', notificationId);
            
            const response = await apiClient.patch(`/api/notifications/${notificationId}`, {
                read: true
            });
            
            return {
                success: true,
                notification: response.data
            };

        } catch (error) {
            console.error('NotificationService: Ошибка отметки уведомления', error);
            
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // Удалить уведомление
    async deleteNotification(notificationId) {
        try {
            console.log('NotificationService: Удаление уведомления', notificationId);
            
            const response = await apiClient.delete(`/api/notifications/${notificationId}`);
            
            return {
                success: true
            };

        } catch (error) {
            console.error('NotificationService: Ошибка удаления уведомления', error);
            
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // Получить настройки уведомлений пользователя
    async getSettings() {
        try {
            console.log('NotificationService: Получение настроек уведомлений');
            
            const response = await apiClient.get('/api/notifications/settings');
            
            return {
                success: true,
                settings: response.data
            };

        } catch (error) {
            console.error('NotificationService: Ошибка получения настроек', error);
            
            return {
                success: false,
                error: error.response?.data?.message || error.message,
                settings: {}
            };
        }
    }

    // Обновить настройки уведомлений
    async updateSettings(settings) {
        try {
            console.log('NotificationService: Обновление настроек уведомлений', settings);
            
            const response = await apiClient.put('/api/notifications/settings', settings);
            
            return {
                success: true,
                settings: response.data
            };

        } catch (error) {
            console.error('NotificationService: Ошибка обновления настроек', error);
            
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }
}

export default new NotificationService();
