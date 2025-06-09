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

    // Создать подписку на push уведомления (endpoint не реализован)
    async createSubscription(subscriptionData) {
        console.log('NotificationService: Подписки не реализованы в текущей версии');
        return {
            success: false,
            error: 'Subscriptions not implemented'
        };
    }

    // Отправить уведомление
    async sendNotification(notificationData) {
        try {
            console.log('NotificationService: Отправка уведомления', notificationData);

            const response = await apiClient.post('/api/notifications/send', {
                userId: notificationData.userId,
                title: notificationData.title,
                body: notificationData.message,
                type: notificationData.type || 'info',
                data: notificationData.data || {}
            });

            return {
                success: true,
                notification: response.data.result
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

            const response = await apiClient.put(`/api/notifications/${notificationId}/read`);

            return {
                success: true,
                notification: response.data.notification
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

    // Получить настройки уведомлений пользователя (endpoint не реализован)
    async getSettings() {
        console.log('NotificationService: Настройки не реализованы в текущей версии');
        return {
            success: false,
            error: 'Settings not implemented',
            settings: {}
        };
    }

    // Обновить настройки уведомлений (endpoint не реализован)
    async updateSettings(settings) {
        console.log('NotificationService: Настройки не реализованы в текущей версии');
        return {
            success: false,
            error: 'Settings not implemented'
        };
    }
}

export default new NotificationService();
