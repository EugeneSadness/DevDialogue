import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Axios from 'axios';

function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const navigate = useNavigate();
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await Axios.post(process.env.REACT_APP_BACK_URL+'/api/user/login', formData);
            console.log('Ответ от сервера:', response.data);

            const token = response.data.token;

            // Сохр.токен в хранилище на стороне клиента
            localStorage.setItem("token", token);
            Axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            // После успешного входа, перенаправить
            navigate('/user', { state: {userid: response.data.id, username: response.data.name, email: response.data.email}, replace: true });

        } catch (error) {
            console.error('Ошибка при отправке данных:', error);
        }
    };

    return (
        <div className="auth-container">
            <h2 className="title">Вход в систему</h2>
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
                    />
                </div>
                <button className="btn btn-block" type="submit">Войти</button>
                <Link to="/signup" className="btn-link">Регистрация</Link>
            </form>
        </div>
    );
}

export default Login;
