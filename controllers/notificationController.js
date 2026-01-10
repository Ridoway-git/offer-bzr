const Notification = require('../models/Notification');
const Merchant = require('../models/Merchant');
const Offer = require('../models/Offer');
const Store = require('../models/Store');

// Get all notifications for new offers
const getNewOfferNotifications = async (req, res) => {
  try {
    // Get recent offers and populate store information
    const offers = await Offer.find({})
      .populate('store', 'name category logoUrl')
      .sort({ createdAt: -1 })
      .limit(20)
      .exec();

    // Convert offers to notification-like format
    const notifications = offers.map(offer => ({
      id: offer._id.toString(),
      title: `New Offer from ${offer.store?.name || 'Store'}`,
      message: `${offer.title} - ${offer.discount}${offer.discountType === 'percentage' ? '%' : ''} off on ${offer.store?.name || 'a store'}. Hurry, limited time!`,
      type: 'offer',
      read: false,
      createdAt: offer.createdAt,
      createdBy: 'system',
      offerId: offer._id.toString(),
      storeId: offer.store?._id.toString()
    }));

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching new offer notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

// Send notification to merchant
const sendNotificationToMerchant = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, type = 'info' } = req.body;

    // Check if merchant exists
    const merchant = await Merchant.findById(id);
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }

    // Create notification
    const notification = new Notification({
      merchant: id,
      message,
      type,
      sentBy: 'Admin'
    });

    await notification.save();

    res.json({
      success: true,
      message: 'Notification sent successfully',
      data: {
        notificationId: notification._id,
        merchantId: id,
        message: message,
        type: type,
        timestamp: notification.createdAt
      }
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending notification',
      error: error.message
    });
  }
};

// Get notifications for a merchant
const getMerchantNotifications = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, unreadOnly = false } = req.query;

    // Check if merchant exists
    const merchant = await Merchant.findById(id);
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }

    // Build query
    const query = { merchant: id };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Notification.countDocuments(query);

    res.json({
      success: true,
      data: notifications,
      total: total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

// Get notifications for merchant by token (for authenticated merchants)
const getMerchantNotificationsByToken = async (req, res) => {
  try {
    const merchantId = req.user?.id;
    const { page = 1, limit = 50, unreadOnly = false } = req.query;

    if (!merchantId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Build query
    const query = { merchant: merchantId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Notification.countDocuments(query);

    res.json({
      success: true,
      data: notifications,
      total: total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

// Mark all notifications as read for authenticated merchant
const markAllMerchantNotificationsAsRead = async (req, res) => {
  try {
    const merchantId = req.user?.id;

    if (!merchantId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const result = await Notification.updateMany(
      { merchant: merchantId, isRead: false },
      { 
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      data: {
        merchantId: merchantId,
        updatedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
      error: error.message
    });
  }
};

// Mark notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const merchantId = req.user?.id;

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if merchant is authorized (if merchantId is provided)
    if (merchantId && notification.merchant.toString() !== merchantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to mark this notification as read'
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
};

// Mark all notifications as read for a merchant
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Notification.updateMany(
      { merchant: id, isRead: false },
      { 
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      data: {
        merchantId: id,
        updatedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
      error: error.message
    });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully',
      data: {
        notificationId: id
      }
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message
    });
  }
};

module.exports = {
  getNewOfferNotifications,
  sendNotificationToMerchant,
  getMerchantNotifications,
  getMerchantNotificationsByToken,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  markAllMerchantNotificationsAsRead,
  deleteNotification
};