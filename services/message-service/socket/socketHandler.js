const axios = require('axios');
const { getMessageModel } = require('../models/Message');
const { getChatMemberModel } = require('../models/ChatMember');
const { getChatModel } = require('../models/Chat');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

// In-memory storage for connected users
const connectedUsers = new Map(); // userId -> socketId
const userSockets = new Map(); // socketId -> userId

// Verify token with auth service
const verifyToken = async (token) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/verify`, {
      token
    }, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.valid ? response.data : null;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
};

const socketHandler = (io) => {
  io.on('connection', async (socket) => {
    console.log(`🔌 New socket connection: ${socket.id}`);

    // Authentication
    socket.on('authenticate', async (data) => {
      try {
        const { token } = data;
        
        if (!token) {
          socket.emit('auth_error', { error: 'Token required' });
          return;
        }

        const authData = await verifyToken(token);
        if (!authData) {
          socket.emit('auth_error', { error: 'Invalid token' });
          return;
        }

        // Store user connection
        const userId = authData.userId;
        connectedUsers.set(userId, socket.id);
        userSockets.set(socket.id, userId);
        
        // Join user to their personal room
        socket.join(`user_${userId}`);
        
        // Join user to their chat rooms
        try {
          const ChatMember = getChatMemberModel();
          const userChats = await ChatMember.findUserChats(userId);
          
          for (const membership of userChats) {
            socket.join(`chat_${membership.chatId}`);
          }
          
          console.log(`✅ User ${userId} authenticated and joined ${userChats.length} chats`);
        } catch (error) {
          console.error('Error joining chat rooms:', error);
        }

        socket.emit('authenticated', { 
          userId,
          message: 'Successfully authenticated' 
        });

        // Notify others that user is online
        socket.broadcast.emit('user_online', { userId });

      } catch (error) {
        console.error('Authentication error:', error);
        socket.emit('auth_error', { error: 'Authentication failed' });
      }
    });

    // Send message
    socket.on('send_message', async (data) => {
      try {
        const userId = userSockets.get(socket.id);
        if (!userId) {
          socket.emit('error', { error: 'Not authenticated' });
          return;
        }

        const { content, chatId, messageType = 'text', replyToId = null } = data;

        // Validate input
        if (!content || !chatId) {
          socket.emit('error', { error: 'Content and chatId are required' });
          return;
        }

        const Message = getMessageModel();
        const ChatMember = getChatMemberModel();
        const Chat = getChatModel();

        // Check if user is member of the chat
        const membership = await ChatMember.findByUserAndChat(userId, chatId);
        if (!membership) {
          socket.emit('error', { error: 'Access denied: You are not a member of this chat' });
          return;
        }

        // Check permissions
        if (!membership.permissions.canSendMessages) {
          socket.emit('error', { error: 'Access denied: You do not have permission to send messages' });
          return;
        }

        // Create message
        const message = await Message.create({
          content,
          senderId: userId,
          chatId,
          messageType,
          replyToId
        });

        // Update chat's last message time
        const chat = await Chat.findByPk(chatId);
        if (chat) {
          await chat.updateLastMessage();
        }

        // Increment unread count for other members
        const otherMembers = await ChatMember.findChatMembers(chatId);
        for (const member of otherMembers) {
          if (member.userId !== userId && member.isActive) {
            await member.incrementUnreadCount();
          }
        }

        // Emit message to all chat members
        io.to(`chat_${chatId}`).emit('new_message', {
          message,
          chat: {
            id: chatId,
            title: chat?.title
          }
        });

        // Send confirmation to sender
        socket.emit('message_sent', { 
          messageId: message.id,
          timestamp: message.createdAt 
        });

        console.log(`📨 Message sent by user ${userId} to chat ${chatId}`);

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { error: 'Failed to send message' });
      }
    });

    // Join chat room
    socket.on('join_chat', async (data) => {
      try {
        const userId = userSockets.get(socket.id);
        if (!userId) {
          socket.emit('error', { error: 'Not authenticated' });
          return;
        }

        const { chatId } = data;
        
        // Check if user is member of the chat
        const ChatMember = getChatMemberModel();
        const membership = await ChatMember.findByUserAndChat(userId, chatId);
        
        if (!membership) {
          socket.emit('error', { error: 'Access denied: You are not a member of this chat' });
          return;
        }

        socket.join(`chat_${chatId}`);
        socket.emit('joined_chat', { chatId });
        
        console.log(`👥 User ${userId} joined chat ${chatId}`);

      } catch (error) {
        console.error('Join chat error:', error);
        socket.emit('error', { error: 'Failed to join chat' });
      }
    });

    // Leave chat room
    socket.on('leave_chat', (data) => {
      const { chatId } = data;
      socket.leave(`chat_${chatId}`);
      socket.emit('left_chat', { chatId });
      
      const userId = userSockets.get(socket.id);
      console.log(`👋 User ${userId} left chat ${chatId}`);
    });

    // Typing indicators
    socket.on('typing_start', (data) => {
      const userId = userSockets.get(socket.id);
      if (!userId) return;

      const { chatId } = data;
      socket.to(`chat_${chatId}`).emit('user_typing', { 
        userId, 
        chatId,
        isTyping: true 
      });
    });

    socket.on('typing_stop', (data) => {
      const userId = userSockets.get(socket.id);
      if (!userId) return;

      const { chatId } = data;
      socket.to(`chat_${chatId}`).emit('user_typing', { 
        userId, 
        chatId,
        isTyping: false 
      });
    });

    // Mark messages as read
    socket.on('mark_as_read', async (data) => {
      try {
        const userId = userSockets.get(socket.id);
        if (!userId) return;

        const { chatId, messageId } = data;
        
        const ChatMember = getChatMemberModel();
        const membership = await ChatMember.findByUserAndChat(userId, chatId);
        
        if (membership) {
          await membership.markAsRead(messageId);
          
          // Notify other chat members
          socket.to(`chat_${chatId}`).emit('message_read', {
            userId,
            chatId,
            messageId
          });
        }

      } catch (error) {
        console.error('Mark as read error:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const userId = userSockets.get(socket.id);
      
      if (userId) {
        connectedUsers.delete(userId);
        userSockets.delete(socket.id);
        
        // Notify others that user is offline
        socket.broadcast.emit('user_offline', { userId });
        
        console.log(`🔌 User ${userId} disconnected (${socket.id})`);
      } else {
        console.log(`🔌 Anonymous user disconnected (${socket.id})`);
      }
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Utility function to send message to specific user
  io.sendToUser = (userId, event, data) => {
    const socketId = connectedUsers.get(userId);
    if (socketId) {
      io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  };

  // Utility function to send message to chat
  io.sendToChat = (chatId, event, data) => {
    io.to(`chat_${chatId}`).emit(event, data);
  };

  console.log('🚀 Socket.IO handler initialized');
};

module.exports = socketHandler;
