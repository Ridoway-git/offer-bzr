const Notification = require('../models/Notification');
const Merchant = require('../models/Merchant');

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

// Mark notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      id,
      { 
        isRead: true,
        readAt: new Date()
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

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
  sendNotificationToMerchant,
  getMerchantNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
};
