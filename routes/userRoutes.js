const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');

// Root route for user-auth (to handle GET /api/v1/hotel/user-auth/)
router.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'User Authentication API',
    endpoints: {
      'POST /register': 'Register new user',
      'POST /login': 'Login user',
      'GET /profile/:id': 'Get user profile',
      'PUT /profile/:id': 'Update user profile',
      'GET /all': 'Get all users (admin)'
    }
  });
});

// User authentication routes
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

// User profile routes
router.get('/profile/:id', userController.getUserProfile);
router.put('/profile/:id', userController.updateUserProfile);

// Admin routes
router.get('/all', userController.getAllUsers);

module.exports = router;