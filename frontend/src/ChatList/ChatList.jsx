import React, {useState} from 'react';
import './ChatList.css';

function ChatList() {
    const[chats, setChats] = useState([]);
    const[chatName, setChatName] = useState('');


    const inputChat = () =>{
       return <input value={chatName} onChange={e => setChatName(e.target.value)} />
    }

    const deleteInputChat = () =>{

    }


    const addChat = () => {

        inputChat()

        const newChat = {
            id: chats.length + 1,
            text: chatName,
        };


        setChats([...chats, newChat]);
    }

    const deleteChat = () => {
        inputChat()

        setChats(chats => chats.filter(item => item.name !== chatName))
    }

    console.log(chats);


    return(
         <div className="main-page">
             <ul className="chat-list">
                 <input value={chatName} onChange={e => setChatName(e.target.value)}/>
                 <button onClick={addChat}>Add new chat</button>

                 <input value={chatName} onChange={e => setChatName(e.target.value)}/>
                 <button onClick={deleteChat}>Delete chat</button>
                 {chats.map((chat) => (
                     <li key={chat.id} className="chat-list-item">{chat.text}</li>
                 ))}
             </ul>

         </div>
    );
}

export default ChatList;