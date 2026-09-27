/** @jest-environment jsdom */

import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type INotification,
} from "../../../api/notificationsApi";
import { useNotificationsSocket } from "../use-notifications-socket";
import type { TUseNotificationsSocketOptions } from "../use-notifications-socket/types";
import { useNotifications } from "./use-notifications";

jest.mock("../../../api/notificationsApi", () => ({
  getNotifications: jest.fn(),
  markNotificationAsRead: jest.fn(),
  markAllNotificationsAsRead: jest.fn(),
}));

jest.mock("../use-notifications-socket", () => ({
  useNotificationsSocket: jest.fn(),
}));

const mockedGetNotifications = jest.mocked(getNotifications);
const mockedMarkAsRead = jest.mocked(markNotificationAsRead);
const mockedMarkAllAsRead = jest.mocked(markAllNotificationsAsRead);
const mockedUseNotificationsSocket = jest.mocked(useNotificationsSocket);

const buildNotification = (
  overrides: Partial<INotification> = {},
): INotification => ({
  id: "notification-1",
  type: "NEW_REQUEST",
  skillName: "TypeScript",
  skillId: "skill-1",
  fromUser: "Алексей",
  isRead: false,
  createdAt: "2026-09-14T20:00:00.000Z",
  ...overrides,
});

describe("useNotifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetNotifications.mockResolvedValue([]);
  });

  test("не запрашивает уведомления, если выключено", () => {
    renderHook(() => useNotifications({ enabled: false }));

    expect(mockedGetNotifications).not.toHaveBeenCalled();
  });

  test("загружает уведомления при монтировании и считает непрочитанные", async () => {
    mockedGetNotifications.mockResolvedValue([
      buildNotification({ id: "1", isRead: false }),
      buildNotification({ id: "2", isRead: true }),
    ]);

    const { result } = renderHook(() => useNotifications({ enabled: true }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.unreadCount).toBe(1);
  });

  test("markAsRead обновляет уведомление данными, которые вернул сервер", async () => {
    mockedGetNotifications.mockResolvedValue([
      buildNotification({ id: "1", isRead: false }),
    ]);
    mockedMarkAsRead.mockResolvedValue(
      buildNotification({ id: "1", isRead: true }),
    );

    const { result } = renderHook(() => useNotifications({ enabled: true }));

    await waitFor(() => expect(result.current.notifications).toHaveLength(1));

    await act(async () => {
      await result.current.markAsRead("1");
    });

    expect(mockedMarkAsRead).toHaveBeenCalledWith("1");
    expect(result.current.notifications[0].isRead).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });

  test("markAllAsRead помечает прочитанными все уведомления после ответа сервера", async () => {
    mockedGetNotifications.mockResolvedValue([
      buildNotification({ id: "1", isRead: false }),
      buildNotification({ id: "2", isRead: false }),
    ]);
    mockedMarkAllAsRead.mockResolvedValue({ updated: 2 });

    const { result } = renderHook(() => useNotifications({ enabled: true }));

    await waitFor(() => expect(result.current.notifications).toHaveLength(2));

    await act(async () => {
      await result.current.markAllAsRead();
    });

    expect(result.current.unreadCount).toBe(0);
  });

  test("добавляет в начало списка уведомление, пришедшее по сокету", async () => {
    let socketOptions: TUseNotificationsSocketOptions | undefined;
    mockedUseNotificationsSocket.mockImplementation((options) => {
      socketOptions = options;
      return { current: null };
    });

    const { result } = renderHook(() => useNotifications({ enabled: true }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const pushed = buildNotification({ id: "live", skillName: "Гитара" });

    act(() => {
      socketOptions?.onNotification(pushed);
    });

    expect(result.current.notifications[0]).toEqual(pushed);
  });
});
