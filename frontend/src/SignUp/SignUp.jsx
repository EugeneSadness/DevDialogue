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

    const checkUsernameAvailability = async (username) => {
        try {
            const response = await Axios.get(`https://api.devdialogue.ru/api/user/checkUsername?username=${username}`);
            setUsernameAvailable(response.data.available);
        } catch (error) {
            console.error('Error checking username availability:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'name') {
            setFormData({
                ...formData,
                [name]: value
            });
            checkUsernameAvailability(value);
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if(!formData.email.includes('@')){
            alert("Введите корректный адрес почты");
            return;
        }

        try {
            // Выполнить POST-запрос на сервер, передав данные formData
            const response = await Axios.post('https://api.devdialogue.ru/api/user/registration', formData);
            console.log('Ответ от сервера:', response.data);

            const token = response.data.token;
            localStorage.setItem("token", token);

            Axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const idResp = await Axios.get('https://api.devdialogue.ru/api/user/getId');

            navigate('/user', { state: {userid: idResp.data.userId, username: formData.name , email: formData.email}, replace: true });

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