import React, { useEffect, useState } from 'react';
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



    const [theme, setTheme] = useState("light");

    const switchTheme = () => {
        setTheme((cur) => (cur === "light" ? "dark" : "light"))
    }


    if (token) {
        Axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        navigate("/", { replace: true });
        console.log("No token provided!");
    }

    const fetchMessagesFromDatabase = async () => {
        try {
            const response = await Axios.post(process.env.REACT_APP_BACK_URL + '/api/message/getAllMessagesFromChat', { chatId });
            const data = response.data;
            setMessages(data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };



    const sendMessageAndPicture = () => {
        const messageData = { content: message, senderId: userid, username: username, chatId: chatId };
        socket.emit('chatMessage', messageData);
        setMessages(prevMessages => [...prevMessages,
        {
            content: message,
            senderId: userid,
            username: username,
            chatId: chatId
        }]);
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

    const deleteAllMessagesFromChat = async () => {
        try {
            const response = await Axios.post(process.env.REACT_APP_BACK_URL + '/api/message/delAllMessagesFromChat',
                { chatId });
            setMessages([]);
            setMessage('');
        } catch (error) {
            console.error('Error deleting all messages:', error);
        }
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
        fetchMessagesFromDatabase();
    }, []);

    useEffect(() => {
        socket.on("chat message", async (data) => {
            const isMessageAlreadyPresent = messages.some(
                (msg) => msg.content === data.content && msg.senderId === data.senderId && msg.username === data.username
            );

            if (!isMessageAlreadyPresent) {
                setMessages((prevMessages) => [...prevMessages, data]);
            }
        });
        return () => socket.off('chat message');
    }, [messages, socket]);

    const openModalUsernameWindow = () => {
        setModalUsernameWindowIsOpen(true)
    }

    const closeModalUsernameWindow = () => {
        setModalUsernameWindowIsOpen(false)
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
            <div className="chat-container">
                <div style={{ color: theme === "light" ? "black" : "yellow" }} className="messages">
                    <ul>
                        {messages.map((msg, index) => (
                            <li
                                key={index}
                                className={`${msg.senderId === userid ? "sent" : "received"}`}
                            >
                                <button className='username-button' onClick={openModalUsernameWindow}>
                                    {msg.username}
                                </button>:
                                {msg.content}
                            </li>
                        ))}
                    </ul>
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
                    <option>Email: {email}</option>
                    <option>Name:  {username}</option>

                </form>
            </Modal>

            <Modal isOpen={modalAddUserModalWindowIsOpen} onRequestClose={closeModalAddUserWindow} ariaHideApp={false} className='modal-window-add-user'>
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
                            <button onClick={() => addFriendToChat(modalAddUserWindowData)}>Add {modalAddUserWindowData.username} to chat</button>
                        </div>
                    )}
                </span>
            </Modal>

            {/* Delete All Messages Button
            <div className="delete-all-button">
                <button className="delete-button" onClick={deleteAllMessagesFromChat}>Delete All Messages</button>
            </div>
            */}
        </div>
    );

}

export default Chat;