import React, { useState } from 'react';
import Axios from 'axios';
import { useNavigate, Link } from "react-router-dom";

function RegistrationForm() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if(!formData.email.includes('@')){
            alert("Введите корректный адрес почты");
            return;
        }

        try {
            const response = await Axios.post(process.env.REACT_APP_BACK_URL+'/api/user/registration', formData);

            if (response.data.unvailableEmail) {
                alert("Email уже зарегистрирован");
                return;
            }
            if (response.data.unavailableUserName) {
                alert("Имя пользователя уже занято");
                return;
            }

            const token = response.data.token;
            localStorage.setItem("token", token);

            Axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            navigate('/user', { state: {userid: response.data.id, username: formData.name , email: formData.email}, replace: true });

        } catch (error) {
            console.error('Ошибка при отправке данных:', error.response?.data?.message || error.message || error);
        }
    };

    return (
        <div className="auth-container">
            <h2 className="title">Регистрация</h2>
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
                    />
                </div>
                <div className="form-group">
                    <input
                        type="password"
                        name="password"
                        minLength="3"
                        maxLength="8"
                        value={formData.password}
                        required
                        onChange={handleInputChange}
                        placeholder="Пароль (3-8 символов)"
                    />
                </div>
                <button className="btn btn-block" type="submit">Зарегистрироваться</button>
                <Link to="/signin" className="btn-link">Уже есть аккаунт? Войти</Link>
            </form>
        </div>
    );
}

export default RegistrationForm;