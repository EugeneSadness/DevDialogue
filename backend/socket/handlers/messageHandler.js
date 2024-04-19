const { Message } = require('../../models/models');

function handleMessage(io, msg) {
    try {
        console.log("Received message data:", msg);
            
        const newMessage = {
            content: msg.content,
            senderId: msg.senderId
        };
        
        Message.create(newMessage)
            .then((message) => {
                io.emit("chat message", { content: msg.content, senderId: msg.senderId, username: msg.username });
            })
            .catch((error) => {
                console.error("Error saving message: ", error);
            });
            
    } catch (error) {
        console.error("Error handling message: ", error);
    }
}

module.exports = { handleMessage };
