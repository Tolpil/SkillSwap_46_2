import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import type { THeaderIconsProps } from "./types";
import { ThemeContext } from "../../../app/theme-context";
import { Toggle } from "../toggle";
import { Icon } from "../icon";
import { Popover } from "../popover";
import { NotificationGroup } from "../notification-group";
import type { TNotificationWithRoute } from "../notification-group/types";
import styles from "./header.icons.module.css";
import { useSelector } from "../../../services/store";
import { selectFavoriteIds } from "../../../services/favorites/slice";
import { useNotifications } from "../../lib/use-notifications";
import { formatDateLabel } from "../../lib/formatDateLabel";
import type { INotification } from "../../../api/notificationsApi";

const getNotificationText = (
  notification: INotification,
): { title: string; description: string } => {
  switch (notification.type) {
    case "REQUEST_ACCEPTED":
      return {
        title: `${notification.fromUser} принял вашу заявку на «${notification.skillName}»`,
        description: "Перейдите в профиль, чтобы обсудить детали",
      };
    case "REQUEST_REJECTED":
      return {
        title: `${notification.fromUser} отклонил вашу заявку на «${notification.skillName}»`,
        description: "Попробуйте предложить другой навык",
      };
    case "NEW_REQUEST":
    default:
      return {
        title: `${notification.fromUser} предлагает вам обмен навыком «${notification.skillName}»`,
        description: "Примите обмен, чтобы обсудить детали",
      };
  }
};

const mapNotificationToItem = (
  notification: INotification,
  onActionClick: () => void,
): TNotificationWithRoute => {
  const { title, description } = getNotificationText(notification);

  return {
    id: notification.id,
    title,
    description,
    dateLabel: formatDateLabel(notification.createdAt),
    isRead: notification.isRead,
    actionLabel: "Перейти",
    onActionClick,
    targetSkillId: notification.skillId,
  };
};

export const HeaderIcons: React.FC<THeaderIconsProps> = ({ isUserAuth }) => {
  const { isDarkTheme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const favoriteIds = useSelector(selectFavoriteIds);
  const hasFavorites = favoriteIds.length > 0;

  // Кратковременная "пульсация" при добавлении в избранное
  const [prevFavoriteCount, setPrevFavoriteCount] = useState(
    favoriteIds.length,
  );
  const [isFavoritePulsing, setIsFavoritePulsing] = useState(false);

  if (favoriteIds.length !== prevFavoriteCount) {
    if (favoriteIds.length > prevFavoriteCount) {
      setIsFavoritePulsing(true);
    }
    setPrevFavoriteCount(favoriteIds.length);
  }

  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications({ enabled: isUserAuth });

  const handleNotificationClick = (
    notification: INotification,
    close: () => void,
  ) => {
    void markAsRead(notification.id);
    close();

    if (notification.skillId) {
      navigate(`/skill/${notification.skillId}`);
      return;
    }

    navigate("/profile");
  };

  const handleFavoritesClick = () => {
    navigate("/profile/favorites");
  };

  return (
    <>
      {!isUserAuth ? (
        <div className={styles.themeToggle}>
          <Toggle
            checked={isDarkTheme}
            onChange={toggleTheme}
            checkedIcon="moon"
            uncheckedIcon="sun"
            iconSize={24}
            aria-label="Переключить тему"
          />
        </div>
      ) : (
        <div className={clsx(styles.themeToggle, styles.items)}>
          <Toggle
            checked={isDarkTheme}
            onChange={toggleTheme}
            checkedIcon="moon"
            uncheckedIcon="sun"
            iconSize={24}
            aria-label="Переключить тему"
          />

          <Popover
            position="bottom"
            offset={12}
            panelClassName={styles.notificationPopover}
            trigger={
              <button
                type="button"
                className={styles.iconButton}
                aria-label="Открыть уведомления"
              >
                <Icon
                  name={unreadCount > 0 ? "notification-alert" : "notification"}
                  size={24}
                />
              </button>
            }
          >
            {({ close }) => (
              <NotificationGroup
                notifications={notifications.map((notification) =>
                  mapNotificationToItem(notification, () =>
                    handleNotificationClick(notification, close),
                  ),
                )}
                onReadAll={markAllAsRead}
              />
            )}
          </Popover>

          <button
            type="button"
            className={clsx(
              styles.iconButton,
              styles.favoriteButton,
              hasFavorites && styles.favoriteActive,
              isFavoritePulsing && styles.favoritePulse,
            )}
            aria-label="Перейти в избранное"
            onClick={handleFavoritesClick}
            onAnimationEnd={() => setIsFavoritePulsing(false)}
          >
            <Icon name={hasFavorites ? "like-filled" : "like"} size={24} />
          </button>
        </div>
      )}
    </>
  );
};
