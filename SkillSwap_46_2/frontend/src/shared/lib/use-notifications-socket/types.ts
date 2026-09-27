import type { INotification } from "../../../api/notificationsApi";

// гейтвей эмитит уже сохранённую в БД сущность (см. notifications.gateway.ts
// notifyUser) — форма пришедшего по сокету уведомления совпадает с REST-ответом
export type TNotificationType = INotification["type"];

export type TSocketNotification = INotification;

export type TUseNotificationsSocketOptions = {
  enabled: boolean;
  onNotification: (notification: TSocketNotification) => void;
};
