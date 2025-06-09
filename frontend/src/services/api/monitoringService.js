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

    // Получить статистику использования (endpoint не реализован)
    async getUsageStats() {
        console.log('MonitoringService: Статистика использования не реализована');
        return {
            success: false,
            error: 'Usage stats not implemented',
            stats: {}
        };
    }

    // Получить логи системы (endpoint не реализован)
    async getLogs(filters = {}) {
        console.log('MonitoringService: Логи не реализованы');
        return {
            success: false,
            error: 'Logs not implemented',
            logs: []
        };
    }

    // Отправить событие для мониторинга (endpoint не реализован)
    async sendEvent(eventData) {
        console.log('MonitoringService: События не реализованы');
        return {
            success: false,
            error: 'Events not implemented'
        };
    }

    // Проверить доступность конкретного сервиса
    async checkServiceHealth(serviceName) {
        try {
            console.log('MonitoringService: Проверка сервиса', serviceName);

            const response = await apiClient.get(`/api/health/service/${serviceName}`);

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
