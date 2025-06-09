// Auth Service - для работы с микросервисом аутентификации
import { apiClient, setAuthToken } from './config';

class AuthService {
    // Регистрация пользователя
    async register(userData) {
        try {
            console.log('AuthService: Регистрация пользователя', userData);
            
            const response = await apiClient.post('/api/auth/register', {
                username: userData.name,
                email: userData.email,
                password: userData.password
            });

            const { tokens, user } = response.data;

            if (tokens?.accessToken) {
                setAuthToken(tokens.accessToken);
                console.log('AuthService: Регистрация успешна, токен сохранен');
                return {
                    success: true,
                    token: tokens.accessToken,
                    user: {
                        id: user.id,
                        name: user.username,
                        email: user.email
                    }
                };
            }

            return {
                success: false,
                error: 'Токен не получен'
            };

        } catch (error) {
            console.error('AuthService: Ошибка регистрации', error);
            
            const errorMessage = error.response?.data?.message || error.message;
            
            // Обработка специфичных ошибок
            if (error.response?.data?.unvailableEmail) {
                return {
                    success: false,
                    error: 'Email уже зарегистрирован'
                };
            }
            
            if (error.response?.data?.unavailableUserName) {
                return {
                    success: false,
                    error: 'Имя пользователя уже занято'
                };
            }

            return {
                success: false,
                error: errorMessage
            };
        }
    }

    // Авторизация пользователя
    async login(credentials) {
        try {
            console.log('AuthService: Авторизация пользователя', credentials.email);
            
            const response = await apiClient.post('/api/auth/login', {
                email: credentials.email,
                password: credentials.password
            });

            const { tokens, user } = response.data;

            if (tokens?.accessToken) {
                setAuthToken(tokens.accessToken);
                console.log('AuthService: Авторизация успешна, токен сохранен');
                return {
                    success: true,
                    token: tokens.accessToken,
                    user: {
                        id: user.id,
                        name: user.username,
                        email: user.email
                    }
                };
            }

            return {
                success: false,
                error: 'Токен не получен'
            };

        } catch (error) {
            console.error('AuthService: Ошибка авторизации', error);
            
            const errorMessage = error.response?.data?.message || error.message;
            
            return {
                success: false,
                error: errorMessage
            };
        }
    }

    // Получение профиля пользователя
    async getProfile() {
        try {
            console.log('AuthService: Получение профиля пользователя');

            const response = await apiClient.get('/api/auth/me');

            return {
                success: true,
                user: response.data.user
            };

        } catch (error) {
            console.error('AuthService: Ошибка получения профиля', error);

            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // Выход из системы
    logout() {
        console.log('AuthService: Выход из системы');
        setAuthToken(null);
        return {
            success: true
        };
    }

    // Проверка валидности токена
    async validateToken(token) {
        try {
            const response = await apiClient.post('/api/auth/verify', {
                token: token
            });
            return {
                success: true,
                valid: response.data.valid,
                user: response.data.user
            };
        } catch (error) {
            console.error('AuthService: Ошибка валидации токена', error);
            return {
                success: false,
                valid: false
            };
        }
    }
}

export default new AuthService();
