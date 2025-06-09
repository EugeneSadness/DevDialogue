const express = require('express');
const { getChatModel } = require('../models/Chat');
const { getChatMemberModel } = require('../models/ChatMember');
const authMiddleware = require('../middleware/auth');
const { validateChat } = require('../middleware/validation');

const router = express.Router();

// Get user's chats
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const userId = req.userId;

    const Chat = getChatModel();

    // Get user's chats
    const chats = await Chat.findByUserId(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      chats,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: chats.length
      }
    });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get specific chat
router.get('/:chatId', authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;

    const Chat = getChatModel();
    const ChatMember = getChatMemberModel();

    // Check if user is member of the chat
    const membership = await ChatMember.findByUserAndChat(userId, chatId);
    if (!membership) {
      return res.status(403).json({
        error: 'Access denied: You are not a member of this chat'
      });
    }

    // Get chat details
    const chat = await Chat.findActiveById(chatId);
    if (!chat) {
      return res.status(404).json({
        error: 'Chat not found'
      });
    }

    res.json({
      chat,
      membership
    });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Create a new chat
router.post('/', authMiddleware, validateChat, async (req, res) => {
  try {
    const { name, description, type = 'group', participantIds = [] } = req.body;
    const creatorId = req.userId;

    const Chat = getChatModel();
    const ChatMember = getChatMemberModel();

    // Create chat
    const chat = await Chat.create({
      name,
      description,
      type,
      creatorId
    });

    // Add creator as owner
    await ChatMember.addMember(creatorId, chat.id, 'owner');

    // Add other participants
    if (participantIds.length > 0) {
      for (const participantId of participantIds) {
        if (participantId !== creatorId) {
          await ChatMember.addMember(participantId, chat.id, 'member');
        }
      }
    }

    res.status(201).json({
      message: 'Chat created successfully',
      chat
    });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Update chat
router.put('/:chatId', authMiddleware, validateChat, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { name, description } = req.body;
    const userId = req.userId;

    const Chat = getChatModel();
    const ChatMember = getChatMemberModel();

    // Check if user has admin permissions
    const membership = await ChatMember.findByUserAndChat(userId, chatId);
    if (!membership || !['admin', 'owner'].includes(membership.role)) {
      return res.status(403).json({
        error: 'Access denied: Admin permissions required'
      });
    }

    // Find and update chat
    const chat = await Chat.findActiveById(chatId);
    if (!chat) {
      return res.status(404).json({
        error: 'Chat not found'
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    await chat.update(updateData);

    res.json({
      message: 'Chat updated successfully',
      chat
    });
  } catch (error) {
    console.error('Update chat error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Delete chat
router.delete('/:chatId', authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;

    const Chat = getChatModel();
    const ChatMember = getChatMemberModel();

    // Check if user is owner
    const membership = await ChatMember.findByUserAndChat(userId, chatId);
    if (!membership || membership.role !== 'owner') {
      return res.status(403).json({
        error: 'Access denied: Owner permissions required'
      });
    }

    // Find and deactivate chat
    const chat = await Chat.findActiveById(chatId);
    if (!chat) {
      return res.status(404).json({
        error: 'Chat not found'
      });
    }

    await chat.update({ isActive: false });

    res.json({
      message: 'Chat deleted successfully'
    });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Add member to chat
router.post('/:chatId/members', authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId: newUserId, role = 'member' } = req.body;
    const userId = req.userId;

    const Chat = getChatModel();
    const ChatMember = getChatMemberModel();

    // Check if user has permission to add members
    const membership = await ChatMember.findByUserAndChat(userId, chatId);
    if (!membership || !['admin', 'owner'].includes(membership.role)) {
      return res.status(403).json({
        error: 'Access denied: You do not have permission to add members'
      });
    }

    // Check if chat exists
    const chat = await Chat.findActiveById(chatId);
    if (!chat) {
      return res.status(404).json({
        error: 'Chat not found'
      });
    }

    // Check if user is already a member
    const existingMembership = await ChatMember.findByUserAndChat(newUserId, chatId);
    if (existingMembership) {
      return res.status(409).json({
        error: 'User is already a member of this chat'
      });
    }

    // Add member
    const newMember = await ChatMember.addMember(newUserId, chatId, role);

    res.status(201).json({
      message: 'Member added successfully',
      member: newMember
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Remove member from chat
router.delete('/:chatId/members/:memberId', authMiddleware, async (req, res) => {
  try {
    const { chatId, memberId } = req.params;
    const userId = req.userId;

    const ChatMember = getChatMemberModel();

    // Check if user has permission to remove members
    const membership = await ChatMember.findByUserAndChat(userId, chatId);
    if (!membership || !['admin', 'owner'].includes(membership.role)) {
      return res.status(403).json({
        error: 'Access denied: You do not have permission to remove members'
      });
    }

    // Find member to remove
    const memberToRemove = await ChatMember.findByUserAndChat(memberId, chatId);
    if (!memberToRemove) {
      return res.status(404).json({
        error: 'Member not found'
      });
    }

    // Cannot remove owner
    if (memberToRemove.role === 'owner') {
      return res.status(403).json({
        error: 'Cannot remove chat owner'
      });
    }

    // Remove member
    await memberToRemove.leave();

    res.json({
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Leave chat
router.post('/:chatId/leave', authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;

    const ChatMember = getChatMemberModel();

    // Find membership
    const membership = await ChatMember.findByUserAndChat(userId, chatId);
    if (!membership) {
      return res.status(404).json({
        error: 'You are not a member of this chat'
      });
    }

    // Owner cannot leave (must transfer ownership first)
    if (membership.role === 'owner') {
      return res.status(403).json({
        error: 'Chat owner cannot leave. Transfer ownership first.'
      });
    }

    // Leave chat
    await membership.leave();

    res.json({
      message: 'Left chat successfully'
    });
  } catch (error) {
    console.error('Leave chat error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Search chats
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q: searchTerm, limit = 10, offset = 0 } = req.query;
    const userId = req.userId;

    if (!searchTerm) {
      return res.status(400).json({
        error: 'Search term is required'
      });
    }

    const Chat = getChatModel();

    // Search chats
    const chats = await Chat.searchByTitle(searchTerm, userId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      chats,
      searchTerm,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: chats.length
      }
    });
  } catch (error) {
    console.error('Search chats error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;
