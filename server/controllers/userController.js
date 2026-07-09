const User = require('../models/User');

// Get user profile
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      res.json({
        _id: user.id,
        fullName: user.fullName,
        email: user.email,
        createdAt: user.createdAt,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// Update user profile
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      user.fullName = req.body.fullName || user.fullName;
      user.email = req.body.email || user.email;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser.id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        createdAt: updatedUser.createdAt,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
};
