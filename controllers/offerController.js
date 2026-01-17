const Offer = require('../models/Offer');
const Store = require('../models/Store');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Initialize Firebase Admin SDK with hardcoded credentials
let admin = null;
try {
  const firebaseAdmin = require('firebase-admin');
  
  console.log('Initializing Firebase Admin SDK...');
  
  // Hardcoded service account configuration
  const serviceAccount = {
    type: 'service_account',
    project_id: 'sportshuntapp-fd144',
    private_key_id: '3f18657abf2d7253225e889baa006d0fb2f3d2f1',
    private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDVhCaJLFzMvWRR\nTWC1DaTYbLeKJosy4ojVVKej8fI2ICAEp0kUIJc1AKVB/RPiFW6QOcaWGoSdVWiG\nkfspi53LFgEeCA3AuXzHeDdivBMtLzeCNo9U2ABSKnjhkVOYWAjQ0aZOSp0kQJ9R\n74TU2enxPdLDlc37Sq/+NFf4Ll3dX0xdDfp0685aKk1zbQJbvQFBoIYJ/7MimCZd\ng+43Mv+P/wchkQgUjwxnJW6o9y71TtE7eCyWvTvT4Uk/LbyHc6kRZRV/iLhVKGTW\n+W0greuYdgzi1ONutRTbzsU3bJzk3PlqKI20JVIHro4cr8lbruLJZ2gnuLTELeJ4\nSDTUzyGlAgMBAAECggEAAICqerXMckcWKQUkL48Sx02kXWxPQ/VIelQUCCzNWx6R\njBxVd5bG+UPti/dpRcNQnR6u7WkkfhSgbRe+pZIere4gSp/EdcBBaTUZlTMID3KX\nbdIANku5QRXMbqlYG0z3mKcp/he5t4I+qhJJxBqnrOYfjIo8isaLMZbNG5hVk7ED\nXTsoACF4REqS/sxnWCzI/OAQ1wrHoetX6o5CkOw8MvQqQzBKxCdhVxJEAfrVrbCU\n3yuqMznV/5RqWnf/RTpezoxQLfeko9jNFRCLKkswp1ZAMOJAh392D/as2xRfGyEX\nDsmLw9lolMdY3fQdSxrc4wBOiqDJAujRhdS/PGYWoQKBgQD6PCZxAHdtg9tTFGiO\nfD4s7jtbT7Vh0E14ZU+CMnsLDYui3ZQDJ2ZPSkcx38y34Ptp+RPCwduRHUnjqe/k\nZAkQpW9clC/7vJ6FM2r5+GnKT33ThDVhsosYwuOpTQbMcMn5siCzScZY5ns4KuzY\nti8R8muk8KXXMwO77E5ypChc8QKBgQDab3A/Y5ckJ091sy2S446D9b1VkP0OOwkm\nQS7Lc6f9APwgugl54PsdP7tzE3a6X6dsAsMm7u0J0vHiGvJTdODN6hG/F2ypyMKK\nJTr4DfSQfIHIj1oVEurTgI7dAjXEAaF2w3mAZ8kJioCTrJtHNh8ismj1jZaPL8us\n1zlHyb0f9QKBgD4E+HYban4vJwXRUhS2gGZ8aSO5frgOe5TybyFSx6I2qjwkdNHP\nSxEt1LVsxX1xen6KaDZl+7hcrPqLHNTbYk/I4O/uHnJjDlrvIn1v7zBgQUxSQTTE\nnqr1ap2EZMH41mZXmrk0+L8B6NpD8U3I4aOuFLXdmwzaLPu/lrXdL8/RAoGAPrlP\nTzSG2x/apl6sUIi9jNEM7Dw1Hlf/eZewG0X70B/vRmqFfBUJps19Qz8skboT9mUY\nqt5i/LYxNQ8t1J80SozTSb8tOdfnXQnx0/cV6kOGdRQM9w42lkNNQtN2ovEg71yU\nUDX9OZsm7sDa2ekFqc33a8Obn0RHRTuMPDwG7d0CgYEA5Zo/9wNUjVR2Nv57O5ft\nYaYfGd42LRljx1vYDY6bgvOFlSc0fTt0Nxh7zsHF+Mds+NXR5p7tWolem6bDNPnh\nHPzNSkwx5AF81XcmoOa/qHliEpUE2AMZyY/7tvqNMKrtHQS5O++R0wKcySN3I9V5\n+GBPfX2K54a1GoDM50UOH5g=\n-----END PRIVATE KEY-----\n',
    client_email: 'firebase-adminsdk-ytebf@sportshuntapp-fd144.iam.gserviceaccount.com',
    client_id: '109230385975545175055',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-ytebf%40sportshuntapp-fd144.iam.gserviceaccount.com',
  };
  
  console.log('Service account configured for project:', serviceAccount.project_id);
  
  if (!firebaseAdmin.apps.length) {
    admin = firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized successfully');
  } else {
    admin = firebaseAdmin.app();
    console.log('Using existing Firebase Admin SDK instance');
  }
} catch (error) {
  console.log('Firebase Admin SDK not initialized:', error.message);
  console.error('Detailed error:', error);
}

// Function to send notification about new offer
const sendNewOfferNotification = async (offer) => {
  try {
    console.log('Attempting to send new offer notification for offer:', offer._id);
    
    // Populate store information for the notification
    const store = await Store.findById(offer.store);
    console.log('Found store for notification:', store?.name);
    
    // Create a general notification record in the database
    const Notification = require('../models/Notification');
    
    const notification = new Notification({
      offerId: offer._id,
      storeId: offer.store,
      message: `${offer.title} - ${offer.discount}${offer.discountType === 'percentage' ? '%' : ''} off on ${store?.name || 'a store'}. Hurry, limited time!`,
      type: 'offer',
      sentBy: 'system'
    });
    
    await notification.save();
    console.log('New offer notification saved to database:', notification._id);
    
    if (admin) {
      console.log('Firebase Admin SDK is available, creating notification');
      
      // Use Firebase Admin SDK if available
      const notificationData = {
        title: `New Offer from ${store?.name || 'Store'}`,
        message: `${offer.title} - ${offer.discount}${offer.discountType === 'percentage' ? '%' : ''} off on ${store?.name || 'a store'}. Hurry, limited time!`,
        type: 'offer',
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: 'system',
        offerId: offer._id.toString(),
        storeId: offer.store.toString()
      };
      
      console.log('Notification data prepared:', notificationData);
      
      const notificationsRef = admin.firestore().collection('notifications');
      await notificationsRef.add(notificationData);
      
      console.log('New offer notification sent successfully:', notificationData.title);
    } else {
      console.log('Firebase Admin SDK is NOT available');
      
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
    console.error('Error details:', error.message, error.code, error.stack);
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
