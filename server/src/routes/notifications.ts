import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { dataStore } from '../services/data-store';

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

notificationsRouter.get('/', async (req, res) => res.json(await dataStore.listNotifications(req.user!.id)));
notificationsRouter.get('/unread-count', async (req, res) =>
  res.json({ count: await dataStore.unreadCount(req.user!.id) }),
);
notificationsRouter.patch('/read-all', async (req, res) => {
  return res.json(await dataStore.markAllNotificationsRead(req.user!.id));
});
notificationsRouter.patch('/:notificationId/read', async (req, res) => {
  const notification = await dataStore.markNotificationRead(req.params.notificationId);
  if (!notification) return res.status(404).json({ error: 'notification_not_found' });
  return res.json(notification);
});
