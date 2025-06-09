const validateMessage = (req, res, next) => {
  const { content, chatId, messageType = 'text' } = req.body;
  const errors = [];

  // Validate content
  if (!content || content.trim().length === 0) {
    errors.push('Message content is required');
  } else if (content.length > 3000) {
    errors.push('Message content cannot exceed 3000 characters');
  }

  // Validate chatId
  if (!chatId || !Number.isInteger(Number(chatId)) || Number(chatId) <= 0) {
    errors.push('Valid chat ID is required');
  }

  // Validate messageType
  const validTypes = ['text', 'image', 'file', 'system'];
  if (!validTypes.includes(messageType)) {
    errors.push('Invalid message type');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

const validateChat = (req, res, next) => {
  const { name, type = 'group' } = req.body;
  const errors = [];

  // Validate name
  if (!name || name.trim().length === 0) {
    errors.push('Chat name is required');
  } else if (name.length > 100) {
    errors.push('Chat name cannot exceed 100 characters');
  }

  // Validate type
  const validTypes = ['private', 'group', 'channel'];
  if (!validTypes.includes(type)) {
    errors.push('Invalid chat type');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

const validateChatMember = (req, res, next) => {
  const { userId, role = 'member' } = req.body;
  const errors = [];

  // Validate userId
  if (!userId || !Number.isInteger(Number(userId)) || Number(userId) <= 0) {
    errors.push('Valid user ID is required');
  }

  // Validate role
  const validRoles = ['member', 'admin', 'owner'];
  if (!validRoles.includes(role)) {
    errors.push('Invalid role');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

const validatePagination = (req, res, next) => {
  const { limit, offset } = req.query;
  const errors = [];

  // Validate limit
  if (limit !== undefined) {
    const limitNum = Number(limit);
    if (!Number.isInteger(limitNum) || limitNum <= 0 || limitNum > 100) {
      errors.push('Limit must be a positive integer between 1 and 100');
    }
  }

  // Validate offset
  if (offset !== undefined) {
    const offsetNum = Number(offset);
    if (!Number.isInteger(offsetNum) || offsetNum < 0) {
      errors.push('Offset must be a non-negative integer');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

const validateSearch = (req, res, next) => {
  const { q: searchTerm } = req.query;
  const errors = [];

  // Validate search term
  if (!searchTerm || searchTerm.trim().length === 0) {
    errors.push('Search term is required');
  } else if (searchTerm.length < 2) {
    errors.push('Search term must be at least 2 characters long');
  } else if (searchTerm.length > 100) {
    errors.push('Search term cannot exceed 100 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

module.exports = {
  validateMessage,
  validateChat,
  validateChatMember,
  validatePagination,
  validateSearch
};
