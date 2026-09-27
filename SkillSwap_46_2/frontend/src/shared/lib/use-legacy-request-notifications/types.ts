import type { TNotificationWithRoute } from "../../ui/notification-group/types";

export type TUseLegacyRequestNotificationsResult = {
  notifications: TNotificationWithRoute[];
  unreadCount: number;
  handleReadAll: () => void;
  handleClearRead: () => void;
  handleNotificationClick: (
    notification: TNotificationWithRoute,
    close: () => void,
  ) => void;
};
