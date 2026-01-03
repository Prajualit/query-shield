import { Request, Response } from 'express';
import { prisma } from '../db';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';

// Get all notifications for user
export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { unreadOnly } = req.query;

  const whereClause: any = { userId };
  if (unreadOnly === 'true') {
    whereClause.read = false;
  }

  const notifications = await prisma.notification.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' }, 
    take: 100 // Limit to last 100 notifications
  });

  res.status(200).json(
    new ApiResponse(200, notifications, 'Notifications fetched successfully')
  );
});

// Get unread count
export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const count = await prisma.notification.count({
    where: {
      userId,
      read: false
    }
  });

  res.status(200).json(
    new ApiResponse(200, { count }, 'Unread count fetched successfully')
  );
});

// Mark notification as read
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { notificationId } = req.params;

  const notification = await prisma.notification.findUnique({
    where: { id: notificationId }
  });

  if (!notification || notification.userId !== userId) {
    throw new ApiError(404, 'Notification not found');
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true }
  });

  res.status(200).json(
    new ApiResponse(200, updated, 'Notification marked as read')
  );
});

// Mark all as read
export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  await prisma.notification.updateMany({
    where: {
      userId,
      read: false
    },
    data: { read: true }
  });

  res.status(200).json(
    new ApiResponse(200, null, 'All notifications marked as read')
  );
});

// Delete notification
export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { notificationId } = req.params;

  const notification = await prisma.notification.findUnique({
    where: { id: notificationId }
  });

  if (!notification || notification.userId !== userId) {
    throw new ApiError(404, 'Notification not found');
  }

  await prisma.notification.delete({
    where: { id: notificationId }
  });

  res.status(200).json(
    new ApiResponse(200, null, 'Notification deleted successfully')
  );
});

// Clear all notifications
export const clearAllNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  await prisma.notification.deleteMany({
    where: { userId }
  });

  res.status(200).json(
    new ApiResponse(200, null, 'All notifications cleared')
  );
});

// Create notification (internal use)
export const createNotification = async (
  userId: string,
  type: 'THREAT' | 'SECURITY' | 'TEAM' | 'BILLING' | 'SYSTEM',
  title: string,
  message: string,
  severity: 'CRITICAL' | 'WARNING' | 'INFO' = 'INFO',
  metadata?: any
) => {
  return await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      severity,
      metadata
    }
  });
};

// Get notification preferences
export const getPreferences = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  let preferences = await prisma.notificationPreference.findMany({
    where: { userId }
  });

  // If no preferences exist, create defaults
  if (preferences.length === 0) {
    const defaultPreferences = [
      {
        userId,
        category: 'threats',
        name: 'Threat Alerts',
        description: 'Blocked attacks and security threats',
        email: true,
        push: true,
        slack: true
      },
      {
        userId,
        category: 'detections',
        name: 'Detection Summaries',
        description: 'Daily/weekly detection reports',
        email: true,
        push: false,
        slack: true
      },
      {
        userId,
        category: 'team',
        name: 'Team Activity',
        description: 'Member joins, role changes, invitations',
        email: true,
        push: true,
        slack: false
      },
      {
        userId,
        category: 'billing',
        name: 'Billing & Usage',
        description: 'Subscription updates, usage alerts',
        email: true,
        push: false,
        slack: false
      },
      {
        userId,
        category: 'system',
        name: 'System Updates',
        description: 'Maintenance, new features, announcements',
        email: true,
        push: false,
        slack: false
      }
    ];

    preferences = await Promise.all(
      defaultPreferences.map(pref =>
        prisma.notificationPreference.create({ data: pref })
      )
    );
  }

  res.status(200).json(
    new ApiResponse(200, preferences, 'Preferences fetched successfully')
  );
});

// Update preference
export const updatePreference = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { preferenceId } = req.params;
  const { email, push, slack } = req.body;

  const preference = await prisma.notificationPreference.findUnique({
    where: { id: preferenceId }
  });

  if (!preference || preference.userId !== userId) {
    throw new ApiError(404, 'Preference not found');
  }

  const updated = await prisma.notificationPreference.update({
    where: { id: preferenceId },
    data: {
      email: email !== undefined ? email : preference.email,
      push: push !== undefined ? push : preference.push,
      slack: slack !== undefined ? slack : preference.slack
    }
  });

  res.status(200).json(
    new ApiResponse(200, updated, 'Preference updated successfully')
  );
});

// Bulk update preferences
export const bulkUpdatePreferences = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { preferences } = req.body;

  if (!Array.isArray(preferences)) {
    throw new ApiError(400, 'Preferences must be an array');
  }

  const updates = await Promise.all(
    preferences.map(async (pref: any) => {
      const existing = await prisma.notificationPreference.findFirst({
        where: {
          userId,
          category: pref.category
        }
      });

      if (existing) {
        return prisma.notificationPreference.update({
          where: { id: existing.id },
          data: {
            email: pref.email,
            push: pref.push,
            slack: pref.slack
          }
        });
      }
    })
  );

  res.status(200).json(
    new ApiResponse(200, updates, 'Preferences updated successfully')
  );
});

export { createNotification as createNotificationUtil };
