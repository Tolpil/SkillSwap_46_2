import type { INotification } from "../../../api/notificationsApi";

export type TUseNotificationsOptions = {
  enabled: boolean;
};

export type TUseNotificationsResult = {
  notifications: INotification[];
  isLoading: boolean;
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
};
