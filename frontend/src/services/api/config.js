// API Configuration
import axios from 'axios';

// Базовый URL для API - используем переменную окружения или fallback
const API_BASE_URL = process.env.REACT_APP_API_URL || 
                     process.env.REACT_APP_BACK_URL || 
                     window.location.origin;

// WebSocket URL
const WS_BASE_URL = process.env.REACT_APP_WS_URL || 
                    process.env.REACT_APP_BACK_URL || 
                    window.location.origin;

console.log('API Configuration:', {
    API_BASE_URL,
    WS_BASE_URL,
    env: {
        REACT_APP_API_URL: process.env.REACT_APP_API_URL,
        REACT_APP_WS_URL: process.env.REACT_APP_WS_URL,
        REACT_APP_BACK_URL: process.env.REACT_APP_BACK_URL
    }
});

// Создаем базовый axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor для добавления токена к запросам
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('API Request:', config.method?.toUpperCase(), config.url, config.data);
        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Interceptor для обработки ответов и ошибок
apiClient.interceptors.response.use(
    (response) => {
        console.log('API Response:', response.status, response.config.url);
        return response;
    },
    (error) => {
        console.error('API Error:', {
            status: error.response?.status,
            url: error.config?.url,
            message: error.response?.data?.message || error.message,
            data: error.response?.data
        });

        // Если токен истек (401), перенаправляем на логин
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/signin';
        }

        return Promise.reject(error);
    }
);

// Функция для обновления токена в заголовках
export const setAuthToken = (token) => {
    if (token) {
        localStorage.setItem('token', token);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        localStorage.removeItem('token');
        delete apiClient.defaults.headers.common['Authorization'];
    }
};

// Функция для получения текущего токена
export const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Функция для проверки авторизации
export const isAuthenticated = () => {
    const token = getAuthToken();
    return !!token;
};

export { apiClient, API_BASE_URL, WS_BASE_URL };
