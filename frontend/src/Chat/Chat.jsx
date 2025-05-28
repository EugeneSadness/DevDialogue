import React, { useEffect, useState, useRef } from 'react';
import Axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import "./Chat.css";
import Modal from 'react-modal';


const socket = io(process.env.REACT_APP_BACK_URL);

function Chat() {
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem('token');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [friendName, setFriendName] = useState('');
    const [modalUsernameModalWindowIsOpen, setModalUsernameWindowIsOpen] = useState(false);
    const [modalUsernameWindowData, setModalUsernameWindowData] = useState(null);
    const [modalAddUserModalWindowIsOpen, setModalAddUserWindowIsOpen] = useState(false);
    const [modalAddUserWindowData, setModalAddUserWindowData] = useState(null);
    const { username, userid, chatId, chatName, email } = location.state;
    const [selectedUserInfo, setSelectedUserInfo] = useState(null);
    const [theme, setTheme] = useState("light");
    const [pagination, setPagination] = useState({
        page: 0,
        limit: 30,
        total: 0,
        hasMore: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    const switchTheme = () => {
        setTheme((cur) => (cur === "light" ? "dark" : "light"))
    }

    if (token) {
        Axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        navigate("/", { replace: true });
        console.log("No token provided!");
    }

    const fetchMessagesFromDatabase = async (page = 0, loadMore = false) => {
        try {
            setIsLoading(true);
            console.log(`Попытка загрузить сообщения для чата ${chatId}, страница ${page}`);
            
            if (!chatId) {
                console.error('Отсутствует ID чата');
                setMessages([]);
                setIsLoading(false);
                return;
            }
            
            const chatIdNum = Number(chatId);
            if (isNaN(chatIdNum)) {
                console.error('ID чата не является числом:', chatId);
                setMessages([]);
                setIsLoading(false);
                return;
            }
            
            console.log('Отправка запроса на сервер с ID чата:', chatIdNum, 'страница:', page);
            
            const response = await Axios.post(
                `${process.env.REACT_APP_BACK_URL}/api/message/getAllMessagesFromChat`, 
                { 
                    chatId: chatIdNum,
                    page,
                    limit: pagination.limit
                }
            );
            
            console.log('Ответ от сервера:', response.status, response.statusText);
            
            if (response.status === 200) {
                const data = response.data;
                console.log('Полученные данные:', data);
                
                if (data && data.messages) {
                    console.log('Успешно загружены сообщения:', data.messages.length);
                    
                    if (loadMore) {
                        // Добавляем новые сообщения в конец списка
                        setMessages(prevMessages => [...prevMessages, ...data.messages]);
                    } else {
                        // Заменяем весь список сообщений
                        setMessages(data.messages);
                    }
                    
                    // Обновляем информацию о пагинации
                    setPagination({
                        page,
                        limit: pagination.limit,
                        total: data.pagination?.total || 0,
                        hasMore: data.pagination?.hasMore || false
                    });
                } else {
                    console.error('Получены некорректные данные сообщений:', data);
                    if (!loadMore) {
                        setMessages([]);
                    }
                }
            } else {
                console.error('Ошибка при загрузке сообщений:', response.status, response.statusText);
                if (!loadMore) {
                    setMessages([]);
                }
            }
        } catch (error) {
            console.error('Ошибка при загрузке сообщений:', error);
            
            if (error.response) {
                console.error('Данные ответа сервера:', error.response.data);
                console.error('Статус ответа:', error.response.status);
                console.error('Заголовки ответа:', error.response.headers);
            } else if (error.request) {
                console.error('Запрос был отправлен, но ответ не получен:', error.request);
            } else {
                console.error('Ошибка при настройке запроса:', error.message);
            }
            
            if (!loadMore) {
                setMessages([]);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const loadMoreMessages = () => {
        if (pagination.hasMore && !isLoading) {
            const nextPage = pagination.page + 1;
            fetchMessagesFromDatabase(nextPage, true);
        }
    };

    const handleScroll = () => {
        const container = messagesContainerRef.current;
        if (container) {
            // Если пользователь прокрутил к верху и есть еще сообщения
            if (container.scrollTop === 0 && pagination.hasMore && !isLoading) {
                loadMoreMessages();
            }
        }
    };

    const sendMessageAndPicture = () => {
        if (!message.trim()) {
            console.log('Пустое сообщение не отправляется');
            return;
        }
        
        const messageData = { 
            content: message, 
            senderId: userid, 
            username: username, 
            email: email, 
            chatId: chatId 
        };
        
        console.log('Отправка сообщения через сокет:', messageData);
        socket.emit('chatMessage', messageData);
        
        setMessage('');
    };


    const handleBackToChats = () => {
        navigate('/user', {
            state: {
                username: username,
                userid: userid,
                chatId: chatId,
                chatName: chatName,
                email: email
            }, replace: true
        })
    };

    const findFriend = async (friendName) => {
        try {
            const response = await Axios.post(process.env.REACT_APP_BACK_URL + '/api/user/findUserByName',
                { name: friendName });
            const userData = response.data;
            setModalAddUserWindowData(userData);
        } catch (error) {
            console.error("Error finding user:", error);
        }
    };

    const addFriendToChat = async (friendData) => {
        try {
            const response = await Axios.post(process.env.REACT_APP_BACK_URL + '/api/chat/addUserToChat',
                { chatId: chatId, recieverId: friendData.userid, inviterId: userid });
        } catch (error) {
            console.error(error.response.data.message);
        }
    };

    useEffect(() => {
        fetchMessagesFromDatabase(0);
    }, []);

    useEffect(() => {
        // Прокручиваем до конца списка сообщений при их загрузке
        if (messagesEndRef.current && messages.length > 0) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    useEffect(() => {
        socket.connect();
        
        console.log('Сокет подключен, ожидание сообщений');
        
        const handleChatMessage = (data) => {
            console.log('Получено сообщение через сокет:', data);
            
            if (!data || !data.content || !data.chatId) {
                console.error('Некорректные данные сообщения:', data);
                return;
            }
            
            if (data.chatId !== chatId) {
                console.log('Сообщение не для этого чата:', data.chatId);
                return;
            }

            setMessages((prevMessages) => {
                const isMessageAlreadyPresent = prevMessages.some(msg => 
                    msg.content === data.content && 
                    msg.senderId === data.senderId &&
                    ((msg.id && data.id && msg.id === data.id) || 
                     (msg.timestamp && data.timestamp && Math.abs(new Date(msg.timestamp) - new Date(data.timestamp)) < 1000))
                );

                if (!isMessageAlreadyPresent) {
                    console.log('Добавлено новое сообщение:', data);
                    // Обновляем общее количество сообщений
                    setPagination(prev => ({
                        ...prev,
                        total: prev.total + 1
                    }));
                    return [...prevMessages, data];
                }
                
                console.log('Сообщение уже существует, пропускаем');
                return prevMessages;
            });
        };

        socket.on('chatMessage', handleChatMessage);
        
        return () => {
            console.log('Отключение от сокета');
            socket.off('chatMessage', handleChatMessage);
        };
    }, [chatId]);

    const openModalUsernameWindow = (userInfo) => {
        setSelectedUserInfo(userInfo);
        setModalUsernameWindowIsOpen(true);
    }

    const closeModalUsernameWindow = () => {
        setSelectedUserInfo(null);
        setModalUsernameWindowIsOpen(false);
    }
    const closeModalAddUserWindow = () => {
        setModalAddUserWindowIsOpen(false)
    }

    const openModalAddUserWindow = () => {
        setModalAddUserWindowIsOpen(true)
    }

    return (
        <div className="UserForm" id={theme}>
            <button className="log-out-button" onClick={handleBackToChats}>Back to chats</button>
            <span className="heading">
                <h2 className='chat-title'>Chat: {chatName}</h2>
                <button className='add-user-button' onClick={openModalAddUserWindow}>
                    Add user to chat!
                </button>
            </span>
            <nav className='sidebar'>
                <header>
                    <div className='image-text'>
                        <span className='image'>
                            <img src="logo.png" alt="logo" />
                        </span>
                    </div>
                </header>
            </nav>
            <div className="chat-container">
                <div 
                    style={{ color: theme === "light" ? "black" : "yellow" }} 
                    className="messages" 
                    ref={messagesContainerRef}
                    onScroll={handleScroll}
                >
                    {pagination.hasMore && (
                        <div className="load-more-container">
                            <button 
                                className="load-more-button" 
                                onClick={loadMoreMessages} 
                                disabled={isLoading}
                            >
                                {isLoading ? 'Загрузка...' : 'Загрузить еще сообщения'}
                            </button>
                        </div>
                    )}
                    
                    {messages && messages.length > 0 ? (
                        <ul>
                            {messages.map((msg, index) => (
                                <li
                                    key={`msg-${msg.id}-${index}`}
                                    className={`${msg.senderId === userid ? "sent" : "received"}`}
                                >
                                    <button 
                                        className='username-button' 
                                        onClick={() => openModalUsernameWindow({ 
                                            username: msg.username || 'Unknown', 
                                            email: msg.email || ''
                                        })}
                                    >
                                        {msg.username || 'Unknown'}
                                    </button>:
                                    {msg.content}
                                </li>
                            ))}
                            <div ref={messagesEndRef} />
                        </ul>
                    ) : (
                        <div className="no-messages">
                            <p>История сообщений пуста. Начните общение!</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="input">
                <input
                    className="messages"
                    placeholder="Message..."
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                />
                <button onClick={sendMessageAndPicture}>Send message</button>
            </div>
            <Modal isOpen={modalUsernameModalWindowIsOpen} onRequestClose={closeModalUsernameWindow} ariaHideApp={false} className='modal-window-user-info'>
                <h2>User info</h2>
                <form className='modal-username-form'>
                    {selectedUserInfo && (
                        <>
                            <option>Email: {selectedUserInfo.email}</option>
                            <option>Name:  {selectedUserInfo.username}</option>
                        </>
                    )}
                </form>
            </Modal>

            <Modal isOpen={modalAddUserModalWindowIsOpen} onRequestClose={closeModalAddUserWindow}
                ariaHideApp={false} className='modal-window-add-user'>
                <span>
                    <h2>Add users:</h2>
                    <input
                        className="friendName"
                        placeholder="Search friend by name"
                        value={friendName}
                        onChange={(event) => setFriendName(event.target.value)}
                    />
                    <button onClick={() => findFriend(friendName)}>Search</button>
                    {modalAddUserWindowData && (
                        <div className="user-info">
                            <p>Email: {modalAddUserWindowData.email}</p>
                            <p>Name: {modalAddUserWindowData.username}</p>
                            <button onClick={() => addFriendToChat(modalAddUserWindowData)}>
                                Add {modalAddUserWindowData.username} to chat</button>
                        </div>
                    )}
                </span>
            </Modal>
        </div>
    );

}

export default Chat;