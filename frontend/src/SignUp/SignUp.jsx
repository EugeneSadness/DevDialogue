import React, { useState } from 'react';
import Axios from 'axios';
import {useNavigate} from "react-router-dom";
import "./SignUp.css"


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
            const response = await Axios.post('https://api.devdialogue.ru/api/user/registration', formData);
            console.log('Ответ от сервера:', response.data);

            if (response.data.unvailableEmail) {
                alert("Email is already registered");
            }
            if (response.data.unavailableUserName) {
                alert("Username is unavailable");
            }

            const token = response.data.token;
            localStorage.setItem("token", token);

            Axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            navigate('/user', { state: {userid: response.data.id, username: formData.name , email: formData.email}, replace: true });

        } catch (error) {
            console.error('Ошибка при отправке данных:', error);
        }
    };

    return (
        <div className="signUp">
            <h2>Sign up</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Username:</label>
                    <input
                        type="text"
                        required
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                    />
                </div>
                <div>
                    <label>Email:</label>
                    <input
                        type="text"
                        required
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        name="password"
                        minLength="3"
                        maxLength="8"
                        value={formData.password}
                        required

                        onChange={handleInputChange}
                    />
                </div>
                <button type="submit">Submit</button>
            </form>
        </div>
    );
}

export default RegistrationForm;