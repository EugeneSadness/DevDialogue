import React, { useState } from 'react';
import { useNavigate, Link } from "react-router-dom";
import { authService, ApiUtils } from '../services/api';

function RegistrationForm() {
    const [formData, setFormData] = useState({
        name: '',
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

    const validateForm = () => {
        if (!formData.email.includes('@')) {
            setError("Введите корректный адрес почты");
            return false;
        }

        if (formData.password.length < 3 || formData.password.length > 8) {
            setError("Пароль должен содержать от 3 до 8 символов");
            return false;
        }

        if (!formData.name.trim()) {
            setError("Введите имя пользователя");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            console.log('SignUp: Попытка регистрации пользователя');

            const result = await authService.register(formData);

            if (result.success) {
                console.log('SignUp: Регистрация успешна');

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
                console.error('SignUp: Ошибка регистрации', result.error);
                setError(result.error || 'Ошибка регистрации');
            }

        } catch (error) {
            console.error('SignUp: Неожиданная ошибка', error);
            const errorMessage = ApiUtils.handleApiError(error);
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2 className="title">Регистрация</h2>

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
                        type="text"
                        required
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        autoFocus
                        placeholder="Имя пользователя"
                        disabled={isLoading}
                    />
                </div>
                <div className="form-group">
                    <input
                        type="email"
                        required
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Email"
                        disabled={isLoading}
                    />
                </div>
                <div className="form-group">
                    <input
                        type="password"
                        name="password"
                        minLength="6"
                        maxLength="50"
                        value={formData.password}
                        required
                        onChange={handleInputChange}
                        placeholder="Пароль (минимум 6 символов, буквы и цифры)"
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
                    {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
                </button>
                <Link to="/signin" className="btn-link">Уже есть аккаунт? Войти</Link>
            </form>
        </div>
    );
}

export default RegistrationForm;