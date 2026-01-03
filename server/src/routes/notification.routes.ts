import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getPreferences,
  updatePreference,
  bulkUpdatePreferences
} from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Notifications
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:notificationId/read', markAsRead);
router.patch('/mark-all-read', markAllAsRead);
router.delete('/:notificationId', deleteNotification);
router.delete('/', clearAllNotifications);

// Preferences
router.get('/preferences', getPreferences);
router.patch('/preferences/:preferenceId', updatePreference);
router.patch('/preferences', bulkUpdatePreferences);

export default router;
