import { api } from './client';
import type { Notification } from '../data/boards';

export function listNotifications() {
  return api<Notification[]>('/notifications');
}

export function unreadCount() {
  return api<{ count: number }>('/notifications/unread-count');
}
