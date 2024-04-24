import React, { useState } from 'react';
import './ChatList.css';
import { useLocation} from 'react-router-dom';


function ChatList() {
    const location = useLocation;
    const [chats, setChats] = useState([]);
    const [chatName, setChatName] = useState('');
    const [chatNameForDelete, setChatNameForDelete] = useState('');
    const [chatNameForFind, setChatNameForFind] = useState('');
    const {username, userId} = location.state;


    const deleteInputChat = () => {

    }

     
    const addChat = () => {
        const newChat = {
            id: chats.length + 1,
            text: chatName,
        };
        setChats([...chats, newChat]);
        setChatName('');
    }

    const deleteChat = () => {
    
        setChats(chats => chats.filter(chat => chat.text !== chatNameForDelete));
        setChatNameForDelete('');
    }


    const findChat = () =>{
         
    }


    return (
        <div>

           <header className='header'>
                Name of application
                <h2>
                User: {username}
            </h2>
            </header>
        
            <div className="chat-list">
                <h1>Chats:</h1>


                <input  value={chatName} onChange={e => setChatName(e.target.value)} placeholder='Enter new chat' />
                <button onClick={addChat}>Add chat</button>
               
                <input value={chatNameForDelete} onChange={e => setChatNameForDelete(e.target.value)} placeholder='Enter chat name for delete' />
                <button onClick={deleteChat}>Delete chat</button>
            
                <input value={chatNameForFind} onChange={e => setChatNameForFind(e.target.value)} placeholder='Enter chat name to find' />
                <button onClick={findChat}>Find chat</button>

              </div>

              <ul className='chat-list'>     
                {chats.map((chat) => (
                    <li key={chat.id} className="chat-list-item">{chat.text}</li>
                ))}
            </ul>

        </div>
    );
}

export default ChatList;