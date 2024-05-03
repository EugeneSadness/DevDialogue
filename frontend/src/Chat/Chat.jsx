import React, { useEffect, useState } from 'react';
import Axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import "./Chat.css";
import Modal from 'react-modal'


const socket = io("http://localhost:4000");

function Chat() {
    const navigate = useNavigate();
    const location = useLocation();

    const token = localStorage.getItem('token');

    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [modalUsernameModalWindowIsOpen, setModalUsernameWindowIsOpen] = useState(false);
    const [modalUsernameWindowData, setModalUsernameWindowData] = useState(null);


    const { username, userid, chatId, chatName, email} = location.state;



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
            const response = await Axios.post('http://localhost:4000/api/message/getAllMessagesFromChat', { chatId });
            const data = response.data;
            setMessages(data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };



    const sendMessageAndPicture = () => {
        const messageData = { content: message, senderId: userid, username: username, chatId: chatId };
        socket.emit('chatMessage', messageData);
        setMessages(prevMessages => [...prevMessages, { content: message, senderId: userid, username: username, chatId: chatId }]);
        setMessage('');

    };


    const handleBackToChats = () => {
        navigate('/user', { state: { username: username}, replace: true })
    }

    const deleteAllMessagesFromChat = async () => {
        try {
            const response = await Axios.post('http://localhost:4000/api/message/delAllMessagesFromChat', { chatId });
            setMessages([]);        } catch (error) {
            console.error('Error deleting all messages:', error);
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

    const openModalUsernameWindow = () =>{
          setModalUsernameWindowIsOpen(true)
    }
     
    const closeModalUsernameWindow =() =>{
        setModalUsernameWindowIsOpen(false)
    }



    return (
        <div className="UserForm" id={theme}>
<<<<<<< HEAD
            <button className="log-out-button" onClick={handleBackToChats}>Back to chats</button>
            {/*<input onChange={switchTheme} type="checkbox" id="toggle-btn" />
            <label htmlFor="toggle-btn" className="toggle-label"></label>*/}
=======
            <button className="log-out-button" onClick={handleLogOut}>Log out</button>
>>>>>>> 81258efe665ed07b3626e8cb9924b2789839147b
            <h2  className="heading">
                User: {username}
            </h2>
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

            {/* Delete All Messages Button
            <div className="delete-all-button">
                <button className="delete-button" onClick={deleteAllMessagesFromChat}>Delete All Messages</button>
            </div>
            */}
        </div>
    );

}

export default Chat;