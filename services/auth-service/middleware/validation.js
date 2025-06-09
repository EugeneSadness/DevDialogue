const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // At least 6 characters, contains letters and numbers
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;
  return passwordRegex.test(password);
};

const validateName = (name) => {
  return name && name.trim().length >= 2 && name.trim().length <= 100;
};

const validateRegistration = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  // Validate name
  if (!validateName(name)) {
    errors.push('Name must be between 2 and 100 characters');
  }

  // Validate email
  if (!email || !validateEmail(email)) {
    errors.push('Valid email is required');
  }

  // Validate password
  if (!password || !validatePassword(password)) {
    errors.push('Password must be at least 6 characters and contain letters and numbers');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  // Validate email
  if (!email || !validateEmail(email)) {
    errors.push('Valid email is required');
  }

  // Validate password
  if (!password || password.trim().length === 0) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

const validatePasswordUpdate = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const errors = [];

  // Validate current password
  if (!currentPassword || currentPassword.trim().length === 0) {
    errors.push('Current password is required');
  }

  // Validate new password
  if (!newPassword || !validatePassword(newPassword)) {
    errors.push('New password must be at least 6 characters and contain letters and numbers');
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
  validateRegistration,
  validateLogin,
  validatePasswordUpdate,
  validateEmail,
  validatePassword,
  validateName
};
