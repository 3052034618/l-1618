import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Notification, NotificationType } from "@/types";
import { mockNotifications } from "@/mock/data";
import { generateId, getNowISOString } from "@/utils/generators";

interface NotificationState {
  notifications: Notification[];
  addNotification: (data: {
    userId: string;
    type: NotificationType;
    title: string;
    content: string;
  }) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: (userId: string) => void;
  getUnreadCount: (userId: string) => number;
  getNotificationsByUser: (userId: string) => Notification[];
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: mockNotifications,

      addNotification: (data) => {
        const notification: Notification = {
          id: generateId(),
          ...data,
          isRead: false,
          createdAt: getNowISOString(),
        };
        set({ notifications: [notification, ...get().notifications] });
      },

      markAsRead: (id) => {
        set({
          notifications: get().notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        });
      },

      markAllAsRead: (userId) => {
        set({
          notifications: get().notifications.map((n) =>
            n.userId === userId ? { ...n, isRead: true } : n
          ),
        });
      },

      getUnreadCount: (userId) => {
        return get().notifications.filter((n) => n.userId === userId && !n.isRead)
          .length;
      },

      getNotificationsByUser: (userId) => {
        return get().notifications
          .filter((n) => n.userId === userId)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      },
    }),
    {
      name: "volunteer-notification-storage",
    }
  )
);
