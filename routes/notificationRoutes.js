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

router.post('/merchants/:id/notify', adminAuthMiddleware, sendNotificationToMerchant);

router.get('/merchants/:id/notifications', getMerchantNotifications);

router.put('/notifications/:id/read', markNotificationAsRead);

router.put('/merchants/:id/notifications/read-all', markAllNotificationsAsRead);

router.get('/new-offer-notifications', getNewOfferNotifications);

router.delete('/notifications/:id', deleteNotification);

module.exports = router;
