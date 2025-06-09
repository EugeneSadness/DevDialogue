import React, { useState, useEffect } from 'react';
import './ChatList.css';
import { useLocation, useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import { FaPlus, FaSearch, FaSignOutAlt } from 'react-icons/fa';
import { messageService, authService, ApiUtils } from '../services/api';

function ChatList() {
    const navigate = useNavigate();
    const location = useLocation();
    const [chats, setChats] = useState([]);
    const [chatName, setChatName] = useState('');
    const [chatNameForFind, setChatNameForFind] = useState('');
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isCreatingChat, setIsCreatingChat] = useState(false);

    // Получаем данные пользователя из состояния навигации
    const { username, userid, email } = location.state || {};

    // Проверяем авторизацию
    useEffect(() => {
        if (!username || !userid) {
            console.warn('ChatList: Отсутствуют данные пользователя, перенаправление на вход');
            navigate("/", { replace: true });
        }
    }, [username, userid, navigate]);

    const openModal = () => {
        setModalIsOpen(true);
    };

    const closeModal = () => {
        setModalIsOpen(false);
    };

    const addChat = async (e) => {
        e.preventDefault();
        setError('');

        if (!chatName.trim()) {
            setError("Введите название чата");
            return;
        }

        setIsCreatingChat(true);

        try {
            console.log('ChatList: Создание нового чата', chatName);

            const result = await messageService.createChat({ title: chatName });

            if (result.success) {
                console.log('ChatList: Чат успешно создан', result.chat);

                const newChat = {
                    text: result.chat.title || chatName,
                    id: result.chat.id
                };

                setChats(prevChats => [...prevChats, newChat]);
                setChatName('');
                setModalIsOpen(false);
            } else {
                console.error('ChatList: Ошибка создания чата', result.error);
                setError(result.error || 'Не удалось создать чат');
            }

        } catch (error) {
            console.error('ChatList: Неожиданная ошибка при создании чата', error);
            const errorMessage = ApiUtils.handleApiError(error);
            setError(errorMessage);
        } finally {
            setIsCreatingChat(false);
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
        setIsLoading(true);
        setError('');

        try {
            console.log('ChatList: Загрузка списка чатов');

            const result = await messageService.getUserChats();

            if (result.success) {
                console.log('ChatList: Чаты успешно загружены', result.chats);

                // Преобразуем данные в нужный формат
                const formattedChats = result.chats.map(chat => ({
                    id: chat.id,
                    text: chat.title || chat.name || `Чат ${chat.id}`
                }));

                setChats(formattedChats);
            } else {
                console.error('ChatList: Ошибка загрузки чатов', result.error);
                setError(result.error || 'Не удалось загрузить чаты');
                setChats([]);
            }

        } catch (error) {
            console.error('ChatList: Неожиданная ошибка при загрузке чатов', error);
            const errorMessage = ApiUtils.handleApiError(error);
            setError(errorMessage);
            setChats([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchChatsFromDatabase();
    }, []);

    const goToChat = (chatId, chatName) => {
        navigate(`/chat/${chatId}`, { state: { username, userid, chatId:chatId, chatName, email:email } });
    };

    const handleLogOut = () => {
        console.log('ChatList: Выход из системы');
        authService.logout();
        navigate('/', {replace: true});
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
                        <button className="add-button" onClick={openModal} disabled={isLoading}>
                            <FaPlus /> Создать чат
                        </button>
                        <input
                            value={chatNameForFind}
                            onChange={e => setChatNameForFind(e.target.value)}
                            placeholder='Поиск чата...'
                            disabled={isLoading}
                        />
                        <button className="button-find" onClick={findChat} disabled={isLoading}>
                            <FaSearch /> Найти
                        </button>
                    </div>
                </div>

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

                {isLoading && (
                    <div className="loading-message" style={{
                        textAlign: 'center',
                        padding: '20px',
                        color: '#666'
                    }}>
                        Загрузка чатов...
                    </div>
                )}

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

                    <form className="modal-form" onSubmit={addChat}>
                        <input
                            value={chatName}
                            onChange={e => setChatName(e.target.value)}
                            placeholder='Введите название чата'
                            autoFocus
                            disabled={isCreatingChat}
                        />
                        <input
                            type='text'
                            placeholder='Введите участников (опционально)'
                            disabled={isCreatingChat}
                        />
                        <div className="modal-buttons">
                            <button
                                type="submit"
                                disabled={isCreatingChat}
                                style={{
                                    opacity: isCreatingChat ? 0.6 : 1,
                                    cursor: isCreatingChat ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isCreatingChat ? 'Создание...' : 'Создать'}
                            </button>
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={isCreatingChat}
                            >
                                Отмена
                            </button>
                        </div>
                    </form>
                </Modal>
            </div>
        </div>
    );
};

export default ChatList;
