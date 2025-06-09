const express = require('express');
const { getMessageModel } = require('../models/Message');
const { getChatMemberModel } = require('../models/ChatMember');
const authMiddleware = require('../middleware/auth');
const { validateMessage } = require('../middleware/validation');

const router = express.Router();

// Get messages for a chat
router.get('/chat/:chatId', authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const userId = req.userId;

    const Message = getMessageModel();
    const ChatMember = getChatMemberModel();

    // Check if user is member of the chat
    const membership = await ChatMember.findByUserAndChat(userId, chatId);
    if (!membership) {
      return res.status(403).json({
        error: 'Access denied: You are not a member of this chat'
      });
    }

    // Get messages
    const messages = await Message.findByChatId(chatId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: messages.length
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Send a message
router.post('/', authMiddleware, validateMessage, async (req, res) => {
  try {
    const { content, chatId, messageType = 'text', replyToId = null } = req.body;
    const senderId = req.userId;

    const Message = getMessageModel();
    const ChatMember = getChatMemberModel();

    // Check if user is member of the chat
    const membership = await ChatMember.findByUserAndChat(senderId, chatId);
    if (!membership) {
      return res.status(403).json({
        error: 'Access denied: You are not a member of this chat'
      });
    }

    // Check permissions (simplified - all members can send messages)
    // In a real implementation, you might check role-based permissions

    // Create message
    const message = await Message.create({
      content,
      senderId,
      chatId,
      messageType,
      replyToId
    });

    // Update chat's last message time
    const { getChatModel } = require('../models/Chat');
    const Chat = getChatModel();
    const chat = await Chat.findByPk(chatId);
    if (chat) {
      await chat.updateLastMessage();
    }

    // Increment unread count for other members
    const otherMembers = await ChatMember.findChatMembers(chatId);
    for (const member of otherMembers) {
      if (member.userId !== senderId && member.isActive) {
        await member.incrementUnreadCount();
      }
    }

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Edit a message
router.put('/:messageId', authMiddleware, validateMessage, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    const Message = getMessageModel();

    // Find message
    const message = await Message.findByPk(messageId);
    if (!message) {
      return res.status(404).json({
        error: 'Message not found'
      });
    }

    // Check if user is the sender or has edit permissions
    const ChatMember = getChatMemberModel();
    const membership = await ChatMember.findByUserAndChat(userId, message.chatId);

    if (message.senderId !== userId && !['admin', 'owner'].includes(membership?.role)) {
      return res.status(403).json({
        error: 'Access denied: You can only edit your own messages'
      });
    }

    // Update message
    await message.update({
      content,
      isEdited: true,
      editedAt: new Date()
    });

    res.json({
      message: 'Message updated successfully',
      data: message
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Delete a message
router.delete('/:messageId', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    const Message = getMessageModel();

    // Find message
    const message = await Message.findByPk(messageId);
    if (!message) {
      return res.status(404).json({
        error: 'Message not found'
      });
    }

    // Check if user is the sender or has delete permissions
    const ChatMember = getChatMemberModel();
    const membership = await ChatMember.findByUserAndChat(userId, message.chatId);

    if (message.senderId !== userId && !['admin', 'owner'].includes(membership?.role)) {
      return res.status(403).json({
        error: 'Access denied: You can only delete your own messages'
      });
    }

    // Delete message
    await message.destroy();

    res.json({
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Search messages in chat
router.get('/search/:chatId', authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { q: searchTerm, limit = 20, offset = 0 } = req.query;
    const userId = req.userId;

    if (!searchTerm) {
      return res.status(400).json({
        error: 'Search term is required'
      });
    }

    const Message = getMessageModel();
    const ChatMember = getChatMemberModel();

    // Check if user is member of the chat
    const membership = await ChatMember.findByUserAndChat(userId, chatId);
    if (!membership) {
      return res.status(403).json({
        error: 'Access denied: You are not a member of this chat'
      });
    }

    // Search messages
    const messages = await Message.searchInChat(chatId, searchTerm, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      messages,
      searchTerm,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: messages.length
      }
    });
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Mark messages as read
router.post('/read/:chatId', authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { messageId } = req.body;
    const userId = req.userId;

    const ChatMember = getChatMemberModel();

    // Find membership
    const membership = await ChatMember.findByUserAndChat(userId, chatId);
    if (!membership) {
      return res.status(403).json({
        error: 'Access denied: You are not a member of this chat'
      });
    }

    // Mark as read
    await membership.markAsRead(messageId);

    res.json({
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;
