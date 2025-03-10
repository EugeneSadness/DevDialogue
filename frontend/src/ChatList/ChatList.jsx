import React, { useState, useEffect } from 'react';
import './ChatList.css';
import { useLocation, useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import { FaPlus, FaSearch, FaSignOutAlt } from 'react-icons/fa';
import Axios from 'axios';

function ChatList() {
    const navigate = useNavigate();
    const location = useLocation();
    const [chats, setChats] = useState([]);
    const [chatName, setChatName] = useState('');
    const [chatNameForFind, setChatNameForFind] = useState('');
    const token = localStorage.getItem('token');
    const { username, userid, email } = location.state;
    const [modalIsOpen, setModalIsOpen] = useState(false);

    if (token) {
        Axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        navigate("/", { replace: true });
        console.log("No token provided!");
    };

    const openModal = () => {
        setModalIsOpen(true);
    };

    const closeModal = () => {
        setModalIsOpen(false);
    };

    const addChat = async (e) => {
        e.preventDefault();
        if (!chatName.trim()) {
            alert("Введите название чата");
            return;
        }
        
        try {
            const response = await Axios.post(process.env.REACT_APP_BACK_URL+'/api/chat/createChat', { title: chatName });
            const {id} = response.data;
            const newChat = {
                text: chatName,
                id: id
            };
            setChats([...chats, newChat]);
            setChatName('');
            setModalIsOpen(false);
        } catch (error) {
            console.error("Ошибка при создании чата:", error);
            alert("Не удалось создать чат. Пожалуйста, попробуйте снова.");
        }
    };

    const findChat = () => {
        // Фильтрация чатов по имени (можно реализовать в будущем)
        if (!chatNameForFind.trim()) {
            fetchChatsFromDatabase();
            return;
        }
        
        const filteredChats = chats.filter(chat => 
            chat.text.toLowerCase().includes(chatNameForFind.toLowerCase())
        );
        setChats(filteredChats);
    };

    const fetchChatsFromDatabase = async () => {
        try {
            const response = await Axios.get(process.env.REACT_APP_BACK_URL+'/api/chat/getUserChats');
            const chats = response.data;
            setChats(chats);
        } catch (error) {
            console.error("Ошибка при получении чатов: ", error);
        }
    };

    useEffect(() => {
        fetchChatsFromDatabase();
    }, []);

    const goToChat = (chatId, chatName) => {
        navigate(`/chat/${chatId}`, { state: { username, userid, chatId:chatId, chatName, email:email } });
    };

    const handleLogOut = () => {
        localStorage.removeItem('token');
        navigate('/', {replace: true})
    }

    return (
        <div className='body-chatlist'>
            <button className='button-log-out' onClick={handleLogOut}>
                <FaSignOutAlt /> Выйти
            </button>
            
            <div className="chat-container">
                <div className="chat-header">
                    <h1>Привет, {username}!</h1>
                    <div className="button-container">
                        <button className="add-button" onClick={openModal}>
                            <FaPlus /> Создать чат
                        </button>
                        <input 
                            value={chatNameForFind} 
                            onChange={e => setChatNameForFind(e.target.value)} 
                            placeholder='Поиск чата...' 
                        />
                        <button className="button-find" onClick={findChat}>
                            <FaSearch /> Найти
                        </button>
                    </div>
                </div>

                <ul className='chat-list'>
                    {chats.length > 0 ? (
                        chats.map((chat) => (
                            <li key={chat.id} className="chat-list-item">
                                <span>{chat.text}</span>
                                <button 
                                    onClick={() => goToChat(chat.id, chat.text)} 
                                    className="chat-link"
                                >
                                    Открыть
                                </button>
                            </li>
                        ))
                    ) : (
                        <div className="empty-chats-message">
                            У вас пока нет чатов. Создайте новый чат, нажав кнопку "Создать чат".
                        </div>
                    )}
                </ul>

                <Modal 
                    isOpen={modalIsOpen} 
                    onRequestClose={closeModal} 
                    className="add-chat-modal" 
                    ariaHideApp={false}
                >
                    <h2>Создание нового чата</h2>
                    <form className="modal-form" onSubmit={addChat}>
                        <input 
                            value={chatName} 
                            onChange={e => setChatName(e.target.value)} 
                            placeholder='Введите название чата' 
                            autoFocus
                        />
                        <input 
                            type='text' 
                            placeholder='Введите участников (опционально)' 
                        />
                        <div className="modal-buttons">
                            <button type="submit">Создать</button>
                            <button type="button" onClick={closeModal}>Отмена</button>
                        </div>
                    </form>
                </Modal>
            </div>
        </div>
    );
};

export default ChatList;
