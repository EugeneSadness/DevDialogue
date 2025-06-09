// Monitoring Service - для работы с микросервисом мониторинга
import { apiClient } from './config';

class MonitoringService {
    // Получить статус всех сервисов
    async getHealthStatus() {
        try {
            console.log('MonitoringService: Получение статуса сервисов');
            
            const response = await apiClient.get('/api/health');
            
            return {
                success: true,
                status: response.data
            };

        } catch (error) {
            console.error('MonitoringService: Ошибка получения статуса', error);
            
            return {
                success: false,
                error: error.response?.data?.message || error.message,
                status: 'unhealthy'
            };
        }
    }

    // Получить метрики системы
    async getMetrics() {
        try {
            console.log('MonitoringService: Получение метрик системы');
            
            const response = await apiClient.get('/api/metrics');
            
            return {
                success: true,
                metrics: response.data
            };

        } catch (error) {
            console.error('MonitoringService: Ошибка получения метрик', error);
            
            return {
                success: false,
                error: error.response?.data?.message || error.message,
                metrics: {}
            };
        }
    }

    // Получить статистику использования
    async getUsageStats() {
        try {
            console.log('MonitoringService: Получение статистики использования');
            
            const response = await apiClient.get('/api/metrics/usage');
            
            return {
                success: true,
                stats: response.data
            };

        } catch (error) {
            console.error('MonitoringService: Ошибка получения статистики', error);
            
            return {
                success: false,
                error: error.response?.data?.message || error.message,
                stats: {}
            };
        }
    }

    // Получить логи системы
    async getLogs(filters = {}) {
        try {
            console.log('MonitoringService: Получение логов', filters);
            
            const response = await apiClient.get('/api/logs', {
                params: filters
            });
            
            return {
                success: true,
                logs: response.data
            };

        } catch (error) {
            console.error('MonitoringService: Ошибка получения логов', error);
            
            return {
                success: false,
                error: error.response?.data?.message || error.message,
                logs: []
            };
        }
    }

    // Отправить событие для мониторинга
    async sendEvent(eventData) {
        try {
            console.log('MonitoringService: Отправка события', eventData);
            
            const response = await apiClient.post('/api/events', {
                type: eventData.type,
                message: eventData.message,
                level: eventData.level || 'info',
                metadata: eventData.metadata || {}
            });
            
            return {
                success: true,
                event: response.data
            };

        } catch (error) {
            console.error('MonitoringService: Ошибка отправки события', error);
            
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // Проверить доступность конкретного сервиса
    async checkServiceHealth(serviceName) {
        try {
            console.log('MonitoringService: Проверка сервиса', serviceName);
            
            const response = await apiClient.get(`/api/health/${serviceName}`);
            
            return {
                success: true,
                status: response.data
            };

        } catch (error) {
            console.error('MonitoringService: Ошибка проверки сервиса', error);
            
            return {
                success: false,
                error: error.response?.data?.message || error.message,
                status: 'unhealthy'
            };
        }
    }
}

export default new MonitoringService();
