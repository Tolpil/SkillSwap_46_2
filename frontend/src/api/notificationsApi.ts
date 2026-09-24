import type { TId } from "../utils/types";
import { request } from "./client";

export type TNotificationType =
  | "NEW_REQUEST"
  | "REQUEST_ACCEPTED"
  | "REQUEST_REJECTED";


export interface INotification {
  id: TId;
  type: TNotificationType;
  skillName: string;
  skillId?: TId;
  fromUser: string;
  isRead: boolean;
  createdAt: string;
}

//GET all
export const getNotifications = (): Promise<INotification[]> =>
  request<INotification[]>("/notifications");

//PATCH read
export const markNotificationAsRead = (id: TId): Promise<INotification> =>
  request<INotification>(`/notifications/${id}/read`, {
    method: "PATCH",
  });

//PATCH read-all
export const markAllNotificationsAsRead = (): Promise<{ updated: number }> =>
  request<{ updated: number }>("/notifications/read-all", {
    method: "PATCH",
  });
