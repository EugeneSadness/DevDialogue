import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService, ApiUtils } from '../services/api';

function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        // Очищаем ошибку при изменении полей
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            console.log('SignIn: Попытка авторизации пользователя');

            const result = await authService.login(formData);

            if (result.success) {
                console.log('SignIn: Авторизация успешна');

                // Перенаправляем пользователя
                navigate('/user', {
                    state: {
                        userid: result.user.id,
                        username: result.user.name,
                        email: result.user.email
                    },
                    replace: true
                });
            } else {
                console.error('SignIn: Ошибка авторизации', result.error);
                setError(result.error || 'Ошибка авторизации');
            }

        } catch (error) {
            console.error('SignIn: Неожиданная ошибка', error);
            const errorMessage = ApiUtils.handleApiError(error);
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2 className="title">Вход в систему</h2>

            {error && (
                <div className="error-message" style={{
                    color: 'red',
                    marginBottom: '15px',
                    padding: '10px',
                    border: '1px solid red',
                    borderRadius: '4px',
                    backgroundColor: '#ffebee'
                }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        autoFocus
                        placeholder="Email"
                        disabled={isLoading}
                    />
                </div>
                <div className="form-group">
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        placeholder="Пароль"
                        disabled={isLoading}
                    />
                </div>
                <button
                    className="btn btn-block"
                    type="submit"
                    disabled={isLoading}
                    style={{
                        opacity: isLoading ? 0.6 : 1,
                        cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {isLoading ? 'Вход...' : 'Войти'}
                </button>
                <Link to="/signup" className="btn-link">Регистрация</Link>
            </form>
        </div>
    );
}

export default Login;
