import { type FC, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./profile-favorites.module.css";
import { SkillCard } from "../skillcard";
import type { SkillCardProps } from "../skillcard";
import userInfo from "../../assets/images/user-info.svg";
import { Button } from "../../shared/ui/button";
import { useDispatch, useSelector } from "../../services/store";
import { fetchFavoriteSkills, toggleFavoriteSkill } from "../../services/favorites/actions";
import { selectFavoriteIds, selectFavoriteItems } from "../../services/favorites/slice";
import { resolveAssetUrl } from "../../shared/lib/resolveAssetUrl";
import type { IPublicSkillCard } from "../../utils/types";
 
export const ProfileFavorites: FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
 
  const currentUser = useSelector((state) => state.auth.currentUser);
  const sentRequests = useSelector((state) => state.requests.sent);
  const favoriteItems = useSelector(selectFavoriteItems);
  const favoriteIds = useSelector(selectFavoriteIds);
 
  // app.tsx уже подгружает избранное после логина/восстановления сессии,
  // но эта страница может открыться и раньше (например, по прямой ссылке
  // сразу после F5) — на всякий случай подстрахуемся здесь тоже.
  useEffect(() => {
    if (currentUser) dispatch(fetchFavoriteSkills());
  }, [dispatch, currentUser]);
 
  const handleFavoriteClick = (skill: IPublicSkillCard): void => {
    dispatch(toggleFavoriteSkill({ skill, isCurrentlyFavorite: true }));
  };
 
  const handleGoToCatalog = (): void => {
    navigate("/");
  };
 
  const handleGoToLogin = (): void => {
    navigate("/login");
  };
 
  if (!currentUser) {
    return (
      <section className={styles.section}>
        <h1 className={styles.title}>Избранное</h1>
 
        <div className={styles.emptyWrapper}>
          <p className={styles.emptyMessage}>
            Избранное доступно только авторизованным пользователям
          </p>
 
          <div className={styles.actions}>
            <Button variant="secondary" onClick={handleGoToCatalog}>
              Вернуться в каталог
            </Button>
 
            <Button onClick={handleGoToLogin}>Войти</Button>
          </div>
        </div>
      </section>
    );
  }
 
  const cards: SkillCardProps[] = favoriteItems.map((item) => ({
    id: item.id,
    avatar: item.user.avatar ? resolveAssetUrl(item.user.avatar) : userInfo,
    name: item.user.name,
    city: item.user.city?.name ?? "",
    age: item.user.age ?? 0,
    canTeach: item.title,
    wantsToLearn: (item.user.wantToLearn ?? []).map((w) => w.name),
    isFavorite: favoriteIds.includes(item.id),
    onFavoriteClick: () => handleFavoriteClick(item),
    disableDetails: String(item.user.id) === String(currentUser.id),
    exchangeProposed: sentRequests.some(
      (request) => String(request.requiredSkillUserId) === String(item.user.id),
    ),
  }));
 
  return (
    <section className={styles.section}>
      <h1 className={styles.title}>Избранное</h1>
 
      {cards.length === 0 ? (
        <div className={styles.emptyWrapper}>
          <p className={styles.emptyMessage}>Нет избранных карточек</p>
 
          <Button onClick={handleGoToCatalog}>Вернуться в каталог</Button>
        </div>
      ) : (
        <div className={styles.content}>
          <div className={styles.grid}>
            {cards.map((card) => (
              <div key={card.id} className={styles.cardItem}>
                <SkillCard {...card} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};