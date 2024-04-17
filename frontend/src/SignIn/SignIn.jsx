import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Axios from 'axios';
import "./SignIn.css";
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

            const response = await Axios.post('http://localhost:4000/api/user/login', formData);
            console.log('Ответ от сервера:', response.data);

            const token = response.data.token; // Получаем токен из ответа

            // Сохр.токен в хранилище на стороне клиента
            localStorage.setItem("token", token);
            Axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const nameResp = await Axios.get('http://localhost:4000/api/user/getName');
            const idResp = await Axios.get('http://localhost:4000/api/user/getId');
            // После успешного входа, перенаправить
            navigate('/user', { state: {userid: idResp.data.userId, username:  nameResp.data.name}, replace: true });

        } catch (error) {
            console.error('Ошибка при отправке данных:', error);
        }
    };

    return (
        <div className="signIn">
            <h2>Sign in</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Email:</label>
                    <input
                        type="text"
                        name="email"
                        value={formData.email}

                        onChange={handleInputChange}
                    />
                </div>
                <div className="form-group">
                    <label>Password:</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                    />
                </div>
                <button type="submit">Submit</button>
                <div></div>
                <Link to="/signup" className="button-reg">Sign up</Link>
            </form>
        </div>
    );
}

export default Login;
