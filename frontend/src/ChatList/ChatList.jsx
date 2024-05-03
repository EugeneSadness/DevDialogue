import React, { useState, useEffect } from 'react';
import './ChatList.css';
import { useLocation, useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import { FaPlus } from 'react-icons/fa';
import Axios from 'axios';

function ChatList() {
    const navigate = useNavigate();
    const location = useLocation();
    const [chats, setChats] = useState([]);
    const [chatName, setChatName] = useState('');
    const [chatNameForDelete, setChatNameForDelete] = useState('');
    const [chatNameForFind, setChatNameForFind] = useState('');
    const token = localStorage.getItem('token');
    const { username, userid , email} = location.state;
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [modalData, setModalData] = useState(null);

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
        try {
            const response = await Axios.post('http://localhost:4000/api/chat/createChat', { title: chatName });
            const {id} = response.data;
            const newChat = {
                text: chatName,
                id: id
            };
            setChats([...chats, newChat]);
            setChatName('');
            setModalIsOpen(false);
        } catch (error) {
            console.error("Error occurred:", error);
        }
    };

    const findChat = () => {
        
    };


    const fetchChatsFromDatabase = async () => {
        try{
            const response = await Axios.get('http://localhost:4000/api/chat/getUserChats');
            const chats = response.data;
            setChats(chats);
        } catch (error){
            console.error("Error occured: ", error);
        }
    };

    useEffect(() => {
        fetchChatsFromDatabase();
    }, []);

    const goToChat = (chatId, chatName) => {
        navigate(`/chat/${chatId}`, { state: { username, userid, chatId, chatName, email:email } });
    };

    const handleLogOut = ()=>{
        localStorage.removeItem('token');
        navigate('/', {replace: true})
    }


    return (
        <div className='body-chatlist'>
            <div className="chat-container">
                
                <div className="chat-header">
                    <h1>Welcome, {username}!</h1>
                    <div className="button-container">
                        <button className="add-button" onClick={openModal}><FaPlus /> Add Chat</button>
                        <input value={chatNameForFind} onChange={e => setChatNameForFind(e.target.value)} placeholder='Search for chat' />
                        <button className="button-find" onClick={findChat}>Find Chat</button>
                    </div>
                </div>

                <ul className='chat-list'>
                    {chats.map((chat) => (
                        <li key={chat.id} className="chat-list-item">
                            <span>{chat.text}</span>
                            <button onClick={() => goToChat(chat.id, chat.text)} className="chat-link">Go to Chat</button>
                        </li>
                    ))}
                </ul>

                <Modal isOpen={modalIsOpen} onRequestClose={closeModal} className="add-chat-modal" ariaHideApp={false}>
                    <h2>Add Chat</h2>
                    <form className="modal-form">
                        <input value={chatName} onChange={e => setChatName(e.target.value)} placeholder='Enter chat name' />
                        <input type='text' placeholder='Enter participants' />
                        <div className="modal-buttons">
                            <button onClick={addChat}>Add Chat</button>
                            <button onClick={closeModal}>Close</button>
                        </div>
                    </form>
                </Modal>
            </div>
            <button className='button-log-out' onClick={handleLogOut}>Log out</button>
        </div>
        
    );
};

export default ChatList;
