import React, { useEffect, useState } from 'react';
import Axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import "./Chat.css";


const socket = io("http://localhost:4000");

function Chat() {
    const navigate = useNavigate();
    const location = useLocation();

    const token = localStorage.getItem('token');

    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);


    const { username, userid } = location.state;
    const chatId = 1;



    const[theme, setTheme] = useState("light");

    const switchTheme = ()=>{   
        setTheme((cur)=>(cur === "light"?"dark":"light"))
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
        const messageData = { content: message, senderId: userid, username: username, chatId : chatId};
        socket.emit('chatMessage', messageData);
        setMessages(prevMessages => [...prevMessages, { content: message, senderId: userid, username: username, chatId : chatId}]);
        setMessage('');

    };


    const handleLogOut = () =>{
        localStorage.removeItem('token');
        navigate('/', {replace: true})
    }
    
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


    return (
        <div className="UserForm" id={theme}>
            <button className="log-out-button" onClick={handleLogOut}>Log out</button>
            <input onChange={switchTheme} type="checkbox" id="toggle-btn"/>
            <label htmlFor="toggle-btn" className="toggle-label"></label>
            <h2 style={{color: theme === "light" ? "black" : "yellow"}} className="heading">
                User: {username}
            </h2>
            <h1 style={{color: theme === "light" ? "black" : "blue"}}>
                Chat
            </h1>

            {/*Messages*/}
            <div className="chat-container">
                <div style={{color: theme === "light" ? "black" : "yellow"}} className="messages">
                    <ul>
                        {messages.map((msg, index) => (
                            <li
                                key={index}
                                className={`${msg.senderId === userid ? "sent" : "received"}`}
                            >
                                {`${msg.username}: ${msg.content}`}
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

        </div>
    );

}

export default Chat;