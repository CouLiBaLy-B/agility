import { api } from './client';
import type { Notification } from '../data/boards';

export function listNotifications() {
  return api<Notification[]>('/notifications');
}

export function unreadCount() {
  return api<{ count: number }>('/notifications/unread-count');
}

export function markNotificationRead(notificationId: string) {
  return api<Notification>(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
  });
}

export function markAllNotificationsRead() {
  return api<{ updated: number }>('/notifications/read-all', {
    method: 'PATCH',
  });
}
