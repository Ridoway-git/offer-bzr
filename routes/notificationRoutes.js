const express = require('express');
const router = express.Router();
const adminAuthMiddleware = require('../middleware/adminAuth');
const {
  getNewOfferNotifications,
  sendNotificationToMerchant,
  getMerchantNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} = require('../controllers/notificationController');

// Send notification to merchant (admin only)
router.post('/merchants/:id/notify', adminAuthMiddleware, sendNotificationToMerchant);

// Get notifications for a merchant
router.get('/merchants/:id/notifications', getMerchantNotifications);

// Mark notification as read
router.put('/notifications/:id/read', markNotificationAsRead);

// Mark all notifications as read for a merchant
router.put('/merchants/:id/notifications/read-all', markAllNotificationsAsRead);

// Get new offer notifications
router.get('/new-offer-notifications', getNewOfferNotifications);

// Delete notification
router.delete('/notifications/:id', deleteNotification);

module.exports = router;
