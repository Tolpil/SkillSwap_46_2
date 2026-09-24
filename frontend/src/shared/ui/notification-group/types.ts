import type { TNotificationItemProps } from "../notification-item/types";

export type TNotificationGroupItem = TNotificationItemProps & {
  id: string;
};

// общий тип для обеих реализаций колокольчика (БД-уведомления и легаси на
// заявках) — добавляет id навыка для перехода по клику
export type TNotificationWithRoute = TNotificationGroupItem & {
  targetSkillId?: string;
};

export type TNotificationGroupProps = {
  notifications: TNotificationGroupItem[];
  onReadAll?: () => void;
  onClearRead?: () => void;
  className?: string;
};
