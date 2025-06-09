// API Services - централизованный экспорт всех API сервисов
export { default as authService } from './authService';
export { default as messageService } from './messageService';
export { default as notificationService } from './notificationService';
export { default as monitoringService } from './monitoringService';
export { apiClient, setAuthToken, getAuthToken, isAuthenticated, API_BASE_URL, WS_BASE_URL } from './config';

// WebSocket Service
export { default as socketService } from '../websocket/socketService';

// Утилиты для работы с API
export const ApiUtils = {
    // Обработка ошибок API
    handleApiError: (error) => {
        console.error('API Error:', error);
        
        if (error.response) {
            // Сервер ответил с кодом ошибки
            const { status, data } = error.response;
            
            switch (status) {
                case 401:
                    return 'Ошибка авторизации. Пожалуйста, войдите в систему.';
                case 403:
                    return 'Доступ запрещен.';
                case 404:
                    return 'Ресурс не найден.';
                case 500:
                    return 'Внутренняя ошибка сервера.';
                default:
                    return data?.message || `Ошибка сервера (${status})`;
            }
        } else if (error.request) {
            // Запрос был отправлен, но ответ не получен
            return 'Нет соединения с сервером. Проверьте подключение к интернету.';
        } else {
            // Ошибка при настройке запроса
            return error.message || 'Произошла неизвестная ошибка.';
        }
    },

    // Форматирование данных для отправки
    formatRequestData: (data) => {
        // Удаляем пустые поля
        const cleanData = {};
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
                cleanData[key] = data[key];
            }
        });
        return cleanData;
    },

    // Проверка статуса ответа
    isSuccessResponse: (response) => {
        return response && response.status >= 200 && response.status < 300;
    },

    // Извлечение данных из ответа
    extractResponseData: (response) => {
        return response?.data || null;
    }
};
