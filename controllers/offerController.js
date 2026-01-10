const Offer = require('../models/Offer');
const Store = require('../models/Store');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Note: For new offer notifications, we recommend setting up Firebase Admin SDK
// with proper service account credentials. For now, we'll skip direct Firebase integration.
// The notification system is already in place via the frontend's Firestore integration.

// Initialize Firebase Admin SDK (will remain null if not properly configured)
let admin = null;
try {
  // Try to initialize Firebase Admin SDK
  const firebaseAdmin = require('firebase-admin');
  
  // Check if we have service account credentials
  if (process.env.FIREBASE_TYPE === 'service_account' && process.env.FIREBASE_PROJECT_ID) {
    // Initialize with service account details from environment variables
    const serviceAccount = {
      type: process.env.FIREBASE_TYPE,
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI,
      token_uri: process.env.FIREBASE_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    };
    
    // Only initialize if we have the essential credentials
    if (serviceAccount.private_key && serviceAccount.client_email) {
      if (!firebaseAdmin.apps.length) {
        admin = firebaseAdmin.initializeApp({
          credential: firebaseAdmin.credential.cert(serviceAccount),
        });
      } else {
        admin = firebaseAdmin.app();
      }
    }
  }
} catch (error) {
  console.log('Firebase Admin SDK not initialized:', error.message);
}

// Function to send notification about new offer
const sendNewOfferNotification = async (offer) => {
  try {
    // Populate store information for the notification
    const store = await Store.findById(offer.store);
    
    if (admin) {
      // Use Firebase Admin SDK if available
      const notificationData = {
        title: `New Offer from ${store?.name || 'Store'}`,
        message: `${offer.title} - ${offer.discount}${offer.discountType === 'percentage' ? '%' : ''} off on ${store?.name || 'a store'}. Hurry, limited time!`,
        type: 'info',
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: 'system',
        offerId: offer._id.toString(),
        storeId: offer.store.toString()
      };
      
      const notificationsRef = admin.firestore().collection('notifications');
      await notificationsRef.add(notificationData);
      
      console.log('New offer notification sent successfully:', notificationData.title);
    } else {
      // Alternative: Log notification for potential processing by another service
      console.log('New offer notification (not sent due to Firebase Admin unavailability):', {
        title: `New Offer from ${store?.name || 'Store'}`,
        message: `${offer.title} - ${offer.discount}${offer.discountType === 'percentage' ? '%' : ''} off on ${store?.name || 'a store'}. Hurry, limited time!`,
        offerId: offer._id.toString(),
        storeId: offer.store.toString()
      });
    }
  } catch (error) {
    console.error('Error sending new offer notification:', error);
  }
};

// Get all offers
const getAllOffers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      store, 
      isFeatured, 
      isActive,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const query = {};

    // Filter by category if provided
    if (category) {
      query.category = new RegExp(category, 'i');
    }

    // Filter by store if provided
    if (store) {
      query.store = store;
    }

    // Filter by featured status if provided
    if (isFeatured !== undefined) {
      query.isFeatured = isFeatured === 'true';
    }

    // Filter by active status if provided
    if (isActive !== undefined) {
      if (isActive === 'all') {
        // For admin panel, show all offers (including deactivated)
        // Don't add isActive filter
      } else {
        query.isActive = isActive === 'true';
      }
    } else {
      // By default, only show active offers for public API
      query.isActive = true;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { category: new RegExp(search, 'i') },
        { offerCode: new RegExp(search, 'i') }
      ];
    }

    // Filter out expired offers
    query.expiryDate = { $gt: new Date() };

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const offers = await Offer.find(query)
      .populate('store', 'name category logoUrl')
      .populate('merchant', 'name email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    console.log('Offers with merchant data:', offers.map(offer => ({
      id: offer._id,
      title: offer.title,
      merchant: offer.merchant,
      store: offer.store
    })));

    const total = await Offer.countDocuments(query);

    res.json({
      success: true,
      data: offers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalOffers: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching offers',
      error: error.message
    });
  }
};

// Get offer by ID
const getOfferById = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate('store', 'name category logoUrl websiteUrl');
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    res.json({
      success: true,
      data: offer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching offer',
      error: error.message
    });
  }
};

// Create new offer
const createOffer = async (req, res) => {
  try {
    console.log('Admin offer creation request body:', req.body);
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Admin offer validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if store exists
    const store = await Store.findById(req.body.store);
    if (!store) {
      return res.status(400).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check if offer code already exists
    const existingOffer = await Offer.findOne({ offerCode: req.body.offerCode });
    if (existingOffer) {
      return res.status(400).json({
        success: false,
        message: 'Offer code already exists'
      });
    }

    const offer = new Offer(req.body);
    await offer.save();
    await offer.populate('store', 'name category logoUrl');

    // Send notification about new offer
    await sendNewOfferNotification(offer);

    res.status(201).json({
      success: true,
      message: 'Offer created successfully',
      data: offer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating offer',
      error: error.message
    });
  }
};

// Update offer
const updateOffer = async (req, res) => {
  try {
    console.log('Admin offer update request - ID:', req.params.id);
    console.log('Admin offer update request body:', req.body);
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Admin offer update validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if store exists (if store is being updated)
    if (req.body.store) {
      const store = await Store.findById(req.body.store);
      if (!store) {
        return res.status(400).json({
          success: false,
          message: 'Store not found'
        });
      }
    }

    // Check if offer code already exists (if offer code is being updated)
    if (req.body.offerCode) {
      const existingOffer = await Offer.findOne({ 
        offerCode: req.body.offerCode,
        _id: { $ne: req.params.id }
      });
      if (existingOffer) {
        return res.status(400).json({
          success: false,
          message: 'Offer code already exists'
        });
      }
    }

    const offer = await Offer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('store', 'name category logoUrl');

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    res.json({
      success: true,
      message: 'Offer updated successfully',
      data: offer
    });
  } catch (error) {
    console.error('Error updating offer:', error);
    console.error('Request data:', req.body);
    res.status(500).json({
      success: false,
      message: 'Error updating offer',
      error: error.message
    });
  }
};

// Delete offer
const deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    res.json({
      success: true,
      message: 'Offer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting offer',
      error: error.message
    });
  }
};

// Toggle offer featured status
const toggleOfferFeatured = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    offer.isFeatured = !offer.isFeatured;
    await offer.save();
    await offer.populate('store', 'name category logoUrl');

    res.json({
      success: true,
      message: `Offer ${offer.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      data: offer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling offer featured status',
      error: error.message
    });
  }
};

// Toggle offer active status
const toggleOfferStatus = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    offer.isActive = !offer.isActive;
    await offer.save();
    await offer.populate('store', 'name category logoUrl');

    res.json({
      success: true,
      message: `Offer ${offer.isActive ? 'activated' : 'deactivated'} successfully`,
      data: offer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling offer status',
      error: error.message
    });
  }
};

// Get featured offers
const getFeaturedOffers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const offers = await Offer.find({
      isFeatured: true,
      isActive: true,
      expiryDate: { $gt: new Date() }
    })
    .populate('store', 'name category logoUrl')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .exec();

    res.json({
      success: true,
      data: offers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching featured offers',
      error: error.message
    });
  }
};

// Get all categories
const getCategories = async (req, res) => {
  try {
    const categories = await Offer.distinct('category', { isActive: true });
    res.json({
      success: true,
      categories: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

// Get user's favorite offers
const getFavorites = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        favorites: []
      });
    }

    // Extract user info from token
    // For now, we'll use a simple approach - in production you'd verify the JWT
    const userEmail = req.headers['x-user-email'] || 'user@example.com';
    const userUid = req.headers['x-user-uid'] || 'default-uid';
    console.log('Getting favorites for user:', userEmail, 'UID:', userUid);
    
    // Find or create user
    let user = await User.findOne({ email: userEmail });
    if (!user) {
      user = new User({
        email: userEmail,
        displayName: 'User',
        favorites: []
      });
      await user.save();
    }

    // Get user's favorite offers
    const offers = await Offer.find({ 
      _id: { $in: user.favorites },
      isActive: true 
    })
    .populate('store', 'name category logoUrl')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      favorites: offers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching favorites',
      error: error.message
    });
  }
};

// Get favorite status for an offer
const getFavoriteStatus = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { id } = req.params;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        isFavorite: false
      });
    }

    const userEmail = req.headers['x-user-email'] || 'user@example.com';
    const userUid = req.headers['x-user-uid'] || 'default-uid';
    
    // Find user
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.json({
        success: true,
        isFavorite: false
      });
    }

    // Check if offer is in user's favorites
    const isFavorite = user.favorites.includes(id);

    res.json({
      success: true,
      isFavorite: isFavorite
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking favorite status',
      error: error.message
    });
  }
};

// Toggle favorite status for an offer
const toggleFavorite = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { id } = req.params;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userEmail = req.headers['x-user-email'] || 'user@example.com';
    const userUid = req.headers['x-user-uid'] || 'default-uid';
    console.log('Toggling favorite for user:', userEmail, 'UID:', userUid, 'offer:', id);
    
    // Find or create user
    let user = await User.findOne({ email: userEmail });
    if (!user) {
      user = new User({
        email: userEmail,
        displayName: 'User',
        favorites: []
      });
    }

    console.log('Current user favorites:', user.favorites);
    
    // Check if offer is already in favorites
    const isCurrentlyFavorite = user.favorites.some(favId => favId.toString() === id);
    console.log('Is currently favorite:', isCurrentlyFavorite);
    
    if (isCurrentlyFavorite) {
      // Remove from favorites
      user.favorites = user.favorites.filter(favId => favId.toString() !== id);
      await user.save();
      console.log('Removed from favorites. New favorites:', user.favorites);
      
      res.json({
        success: true,
        isFavorite: false,
        message: 'Removed from favorites'
      });
    } else {
      // Add to favorites
      user.favorites.push(id);
      await user.save();
      
      res.json({
        success: true,
        isFavorite: true,
        message: 'Added to favorites'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling favorite',
      error: error.message
    });
  }
};

module.exports = {
  getAllOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
  toggleOfferFeatured,
  toggleOfferStatus,
  getFeaturedOffers,
  getFavorites,
  getCategories,
  getFavoriteStatus,
  toggleFavorite
};
