import { useEffect, useMemo, useReducer } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "../../../services/store";
import { fetchMyRequests } from "../../../services/request/actions";
import { useNotificationsSocket } from "../use-notifications-socket";
import { formatDateLabel } from "../formatDateLabel";
import type { TNotificationWithRoute } from "../../ui/notification-group/types";
import type { TUseLegacyRequestNotificationsResult } from "./types";

const readStorageArray = (key: string | null): string[] => {
  if (!key) return [];

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeStorageArray = (key: string | null, value: string[]) => {
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(value));
};

// Старая реализация колокольчика: уведомления вычисляются на лету из заявок
// (requestsReceived/requestsSent), «прочитано»/«скрыто» хранится в localStorage
// браузера. Заменена на useNotifications (персистентный слой в БД + сокет),
// оставлена нетронутой на случай отката — сейчас нигде не подключена.
export const useLegacyRequestNotifications = (
  isUserAuth: boolean,
): TUseLegacyRequestNotificationsResult => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useNotificationsSocket({
    enabled: isUserAuth,
    onNotification: () => {
      dispatch(fetchMyRequests());
    },
  });

  const requestsReceived = useSelector((state) => state.requests.received);
  const requestsSent = useSelector((state) => state.requests.sent);
  const users = useSelector((state) => state.user.list);
  const currentUser = useSelector((state) => state.auth.currentUser);

  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  const readStorageKey = currentUser?.id
    ? `header-notifications-read-${currentUser.id}`
    : null;

  const hiddenStorageKey = currentUser?.id
    ? `header-notifications-hidden-${currentUser.id}`
    : null;

  const readNotificationIds = readStorageArray(readStorageKey);
  const hiddenNotificationIds = readStorageArray(hiddenStorageKey);

  useEffect(() => {
    if (isUserAuth) {
      dispatch(fetchMyRequests());
    }
  }, [dispatch, isUserAuth]);

  const notifications = useMemo<TNotificationWithRoute[]>(() => {
    const getUserNameById = (userId?: string) => {
      if (!userId) return "Пользователь";

      const user = users.find((item) => String(item.id) === String(userId));
      return user?.name || "Пользователь";
    };

    const receivedNotifications: TNotificationWithRoute[] = requestsReceived
      .filter((request) => request.status === "pending" || !request.status)
      .map((request) => ({
        id: `received-${request.id}`,
        title: `${getUserNameById(request.fromUserId)} предлагает вам обмен`,
        description: "Примите обмен, чтобы обсудить детали",
        dateLabel: formatDateLabel(request.createdAt),
        isRead: readNotificationIds.includes(`received-${request.id}`),
        actionLabel: "Перейти",
        onActionClick: undefined,
        // предложенный отправителем навык, а не его userId
        targetSkillId: request.userSkill,
      }));

    const acceptedStatuses = ["accepted", "inProgress", "done"];

    const sentNotifications: TNotificationWithRoute[] = requestsSent
      .filter(
        (request) =>
          !!request.status && acceptedStatuses.includes(request.status),
      )
      .map((request) => ({
        id: `sent-${request.id}`,
        title: `${getUserNameById(request.toUserId)} принял ваш обмен`,
        description: "Перейдите в профиль, чтобы обсудить детали",
        dateLabel: formatDateLabel(request.updatedAt || request.createdAt),
        isRead: readNotificationIds.includes(`sent-${request.id}`),
        actionLabel: "Перейти",
        onActionClick: undefined,
        // навык, который я запрашивал, а не userId получателя
        targetSkillId: request.requestedSkillId,
      }));

    return [...receivedNotifications, ...sentNotifications].filter(
      (notification) => !hiddenNotificationIds.includes(notification.id),
    );
  }, [
    requestsReceived,
    requestsSent,
    users,
    readNotificationIds,
    hiddenNotificationIds,
  ]);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const handleReadAll = () => {
    const unreadIds = notifications
      .filter((item) => !item.isRead)
      .map((item) => item.id);

    const nextReadIds = [...new Set([...readNotificationIds, ...unreadIds])];
    writeStorageArray(readStorageKey, nextReadIds);
    forceUpdate();
  };

  const handleClearRead = () => {
    const readIds = notifications
      .filter((item) => item.isRead)
      .map((item) => item.id);

    const nextHiddenIds = [...new Set([...hiddenNotificationIds, ...readIds])];
    writeStorageArray(hiddenStorageKey, nextHiddenIds);
    forceUpdate();
  };

  const handleNotificationClick = (
    notification: TNotificationWithRoute,
    close: () => void,
  ) => {
    const nextReadIds = [
      ...new Set([...readNotificationIds, notification.id]),
    ];
    writeStorageArray(readStorageKey, nextReadIds);

    close();
    forceUpdate();

    if (notification.targetSkillId) {
      navigate(`/skill/${notification.targetSkillId}`);
      return;
    }

    navigate("/profile");
  };

  return {
    notifications,
    unreadCount,
    handleReadAll,
    handleClearRead,
    handleNotificationClick,
  };
};
