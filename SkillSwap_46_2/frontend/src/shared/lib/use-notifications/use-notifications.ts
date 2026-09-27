import { useCallback, useEffect, useState } from "react";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type INotification,
} from "../../../api/notificationsApi";
import { useNotificationsSocket } from "../use-notifications-socket";
import type { TUseNotificationsOptions, TUseNotificationsResult } from "./types";

export const useNotifications = ({
  enabled,
}: TUseNotificationsOptions): TUseNotificationsResult => {
  // null = ещё не загружено; setState вызываем только из .then() (асинхронно),
  // чтобы не ловить react-hooks/set-state-in-effect на синхронном вызове в теле эффекта
  const [notifications, setNotifications] = useState<INotification[] | null>(
    null,
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let isCancelled = false;

    getNotifications().then((data) => {
      if (!isCancelled) {
        setNotifications(data);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [enabled]);

  const handleSocketNotification = useCallback(
    (notification: INotification) => {
      setNotifications((prev) => [notification, ...(prev ?? [])]);
    },
    [],
  );

  useNotificationsSocket({
    enabled,
    onNotification: handleSocketNotification,
  });

  const markAsRead = useCallback(async (id: string) => {
    const updated = await markNotificationAsRead(id);
    setNotifications(
      (prev) =>
        prev?.map((notification) =>
          notification.id === id ? updated : notification,
        ) ?? prev,
    );
  }, []);

  const markAllAsRead = useCallback(async () => {
    await markAllNotificationsAsRead();
    setNotifications(
      (prev) =>
        prev?.map((notification) => ({ ...notification, isRead: true })) ??
        prev,
    );
  }, []);

  const effectiveNotifications = enabled ? (notifications ?? []) : [];
  const isLoading = enabled && notifications === null;
  const unreadCount = effectiveNotifications.filter(
    (notification) => !notification.isRead,
  ).length;

  return {
    notifications: effectiveNotifications,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
};
