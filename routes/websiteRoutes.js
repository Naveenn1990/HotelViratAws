const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import website models
const CarouselImage = require('../model/CarouselImage');
const CateringContent = require('../model/CateringContent');
const AppDownloadContent = require('../model/AppDownloadContent');
const ContactMessage = require('../model/ContactMessage');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/website');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'website-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// ==================== CAROUSEL ROUTES ====================

// Get all carousel images
router.get('/carousel', async (req, res) => {
  try {
    const images = await CarouselImage.find().sort({ order: 1, createdAt: -1 });
    res.json({
      success: true,
      images: images
    });
  } catch (error) {
    console.error('Error fetching carousel images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch carousel images',
      error: error.message
    });
  }
});

// Add new carousel image
router.post('/carousel', upload.single('image'), async (req, res) => {
  try {
    console.log('Received carousel POST request:');
    console.log('Body:', req.body);
    console.log('File:', req.file ? req.file.filename : 'No file');
    
    const { title, description, order, isActive } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required'
      });
    }

    const imageUrl = `/uploads/website/${req.file.filename}`;
    
    const newImage = new CarouselImage({
      title: title || '',
      description: description || '',
      imageUrl: imageUrl,
      order: parseInt(order) || 0,
      isActive: isActive === 'true' || isActive === true
    });

    await newImage.save();

    res.json({
      success: true,
      message: 'Carousel image added successfully',
      image: newImage
    });
  } catch (error) {
    console.error('Error adding carousel image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add carousel image',
      error: error.message
    });
  }
});

// Update carousel image
router.put('/carousel/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, order, isActive } = req.body;
    
    const updateData = {
      title: title || '',
      description: description || '',
      order: parseInt(order) || 0,
      isActive: isActive === 'true' || isActive === true
    };

    if (req.file) {
      updateData.imageUrl = `/uploads/website/${req.file.filename}`;
    }

    const updatedImage = await CarouselImage.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!updatedImage) {
      return res.status(404).json({
        success: false,
        message: 'Carousel image not found'
      });
    }

    res.json({
      success: true,
      message: 'Carousel image updated successfully',
      image: updatedImage
    });
  } catch (error) {
    console.error('Error updating carousel image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update carousel image',
      error: error.message
    });
  }
});

// Delete carousel image
router.delete('/carousel/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedImage = await CarouselImage.findByIdAndDelete(id);
    
    if (!deletedImage) {
      return res.status(404).json({
        success: false,
        message: 'Carousel image not found'
      });
    }

    // Delete the image file from filesystem
    if (deletedImage.imageUrl) {
      const imagePath = path.join(__dirname, '..', deletedImage.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.json({
      success: true,
      message: 'Carousel image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting carousel image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete carousel image',
      error: error.message
    });
  }
});

// ==================== CATERING CONTENT ROUTES ====================

// Get catering content
router.get('/catering', async (req, res) => {
  try {
    let content = await CateringContent.findOne();
    
    if (!content) {
      // Create default content if none exists
      content = new CateringContent({
        title: 'Catering Service Available',
        subtitle: 'Delicious food for your special events',
        description: 'We provide exceptional catering services for all types of events including weddings, corporate meetings, parties, and special occasions.',
        features: [
          {
            icon: 'utensils',
            title: 'Fresh & Delicious',
            description: 'All meals prepared fresh with high-quality ingredients'
          },
          {
            icon: 'users',
            title: 'Any Event Size',
            description: 'From intimate gatherings to large celebrations'
          }
        ],
        services: [
          'Wedding Catering',
          'Corporate Events',
          'Birthday Parties',
          'Religious Functions'
        ],
        contactInfo: {
          phone: '+91 9876543210',
          email: 'catering@hotelvirat.com'
        },
        isActive: true
      });
      await content.save();
    }

    res.json({
      success: true,
      content: content
    });
  } catch (error) {
    console.error('Error fetching catering content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch catering content',
      error: error.message
    });
  }
});

// Update catering content
router.put('/catering', upload.single('image'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Parse JSON fields if they're strings
    if (typeof updateData.features === 'string') {
      updateData.features = JSON.parse(updateData.features);
    }
    if (typeof updateData.services === 'string') {
      updateData.services = JSON.parse(updateData.services);
    }
    if (typeof updateData.contactInfo === 'string') {
      updateData.contactInfo = JSON.parse(updateData.contactInfo);
    }

    if (req.file) {
      updateData.imageUrl = `/uploads/website/${req.file.filename}`;
    }

    let content = await CateringContent.findOne();
    
    if (!content) {
      content = new CateringContent(updateData);
    } else {
      Object.assign(content, updateData);
    }
    
    await content.save();

    res.json({
      success: true,
      message: 'Catering content updated successfully',
      content: content
    });
  } catch (error) {
    console.error('Error updating catering content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update catering content',
      error: error.message
    });
  }
});

// ==================== APP DOWNLOAD CONTENT ROUTES ====================

// Get app download content
router.get('/app-download', async (req, res) => {
  try {
    let content = await AppDownloadContent.findOne();
    
    if (!content) {
      // Create default content if none exists
      content = new AppDownloadContent({
        title: 'Download Our App',
        subtitle: 'Get the Hotel Virat mobile app for easy booking and exclusive offers',
        description: 'Experience the convenience of booking rooms, ordering food, and accessing exclusive deals right from your mobile device.',
        features: [
          'Easy room booking',
          'Food ordering',
          'Exclusive app-only deals',
          'Real-time notifications'
        ],
        downloadLinks: {
          android: 'https://play.google.com/store/apps/details?id=com.hotelvirat',
          ios: '#'
        },
        isActive: true
      });
      await content.save();
    }

    res.json({
      success: true,
      content: content
    });
  } catch (error) {
    console.error('Error fetching app download content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch app download content',
      error: error.message
    });
  }
});

// Update app download content
router.put('/app-download', upload.array('appImages', 5), async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Parse JSON fields if they're strings
    if (typeof updateData.features === 'string') {
      updateData.features = JSON.parse(updateData.features);
    }
    if (typeof updateData.downloadLinks === 'string') {
      updateData.downloadLinks = JSON.parse(updateData.downloadLinks);
    }

    if (req.files && req.files.length > 0) {
      updateData.appImages = req.files.map(file => `/uploads/website/${file.filename}`);
    }

    let content = await AppDownloadContent.findOne();
    
    if (!content) {
      content = new AppDownloadContent(updateData);
    } else {
      Object.assign(content, updateData);
    }
    
    await content.save();

    res.json({
      success: true,
      message: 'App download content updated successfully',
      content: content
    });
  } catch (error) {
    console.error('Error updating app download content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update app download content',
      error: error.message
    });
  }
});

// ==================== CONTACT FORM ROUTES ====================

// Submit contact form
router.post('/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, subject, and message are required'
      });
    }

    const contactMessage = new ContactMessage({
      name,
      email,
      phone: phone || '',
      subject,
      message,
      status: 'unread'
    });

    await contactMessage.save();

    res.json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon.'
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again.',
      error: error.message
    });
  }
});

// Get all contact messages (for admin)
router.get('/contact-messages', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const messages = await ContactMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ContactMessage.countDocuments(query);

    res.json({
      success: true,
      messages: messages,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total: total
    });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact messages',
      error: error.message
    });
  }
});

// Update contact message status
router.put('/contact-messages/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['unread', 'read', 'replied'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be unread, read, or replied'
      });
    }

    const message = await ContactMessage.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true }
    );
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    res.json({
      success: true,
      message: 'Message status updated successfully',
      contactMessage: message
    });
  } catch (error) {
    console.error('Error updating message status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update message status',
      error: error.message
    });
  }
});

// Delete contact message
router.delete('/contact-messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedMessage = await ContactMessage.findByIdAndDelete(id);
    
    if (!deletedMessage) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting contact message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete contact message',
      error: error.message
    });
  }
});

module.exports = router;