import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Clock, CheckCircle } from 'lucide-react';
import { notifications as fallbackNotifications } from '../data/boards';
import type { Notification } from '../data/boards';
import { Avatar } from './Avatar';
import { format, parseISO } from 'date-fns';
import { isApiEnabled } from '../api/client';
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../api/notifications';
import { useUsers } from '../context/AppDataContext';

interface InboxProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskClick: (taskId: string) => void;
  onUnreadChange?: (count: number) => void;
}

export function Inbox({ isOpen, onClose, onTaskClick, onUnreadChange }: InboxProps) {
  const users = useUsers();
  const [notifications, setNotifications] = useState<Notification[]>(fallbackNotifications);

  useEffect(() => {
    if (!isOpen || !isApiEnabled()) return;

    let cancelled = false;
    async function loadNotifications() {
      try {
        const remoteNotifications = await listNotifications();
        if (!cancelled) {
          setNotifications(remoteNotifications);
          onUnreadChange?.(remoteNotifications.filter((notification) => !notification.isRead).length);
        }
      } catch (error) {
        console.warn('Unable to load notifications from API.', error);
      }
    }

    void loadNotifications();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const syncUnread = (nextNotifications: Notification[]) => {
    onUnreadChange?.(nextNotifications.filter((notification) => !notification.isRead).length);
  };

  const markReadLocally = (notificationId: string) => {
    setNotifications((current) => {
      const next = current.map((notification) =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification,
      );
      syncUnread(next);
      return next;
    });
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markReadLocally(notification.id);
      if (isApiEnabled()) {
        void markNotificationRead(notification.id).catch((error) =>
          console.warn('Unable to mark notification as read.', error),
        );
      }
    }
    onTaskClick(notification.taskId);
    onClose();
  };

  const handleMarkAllRead = () => {
    setNotifications((current) => {
      const next = current.map((notification) => ({ ...notification, isRead: true }));
      syncUnread(next);
      return next;
    });
    if (isApiEnabled()) {
      void markAllNotificationsRead().catch((error) =>
        console.warn('Unable to mark all notifications as read.', error),
      );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-16 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-500" />
                <h3 className="font-bold text-gray-800">Inbox</h3>
              </div>
              <button
                onClick={onClose}
                aria-label="Close inbox"
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="max-h-[450px] overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {notifications.map((notif) => {
                    const user = users.find((u) => u.id === notif.userId);
                    return (
                      <div
                        key={notif.id}
                        className={`p-4 hover:bg-blue-50 cursor-pointer transition-colors ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                        onClick={() => handleNotificationClick(notif)}
                      >
                        <div className="flex gap-3">
                          <Avatar userId={notif.userId} size="sm" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-800">
                              <span className="font-bold">{user?.name ?? 'Unknown user'}</span> {notif.text}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(parseISO(notif.date), 'MMM d, h:mm a')}
                              </span>
                              {notif.type === 'mention' && (
                                <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded font-medium">Mention</span>
                              )}
                            </div>
                          </div>
                          {!notif.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <CheckCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">You're all caught up!</p>
                </div>
              )}
            </div>
            <div className="p-3 border-t border-gray-100 text-center">
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-blue-500 hover:text-blue-600"
              >
                Mark all as read
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
