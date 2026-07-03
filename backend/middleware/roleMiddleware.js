const allowedRoles = ['Volunteer', 'NGO', 'Admin'];

/**
 * Middleware to authorize users by role.
 * @param {...string} roles - Roles allowed to access the route.
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
    }

    next();
  };
};

module.exports = { authorizeRoles, allowedRoles };
