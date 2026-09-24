import { useState, type FC } from "react";
import userInfo from "../../assets/images/user-info.svg";
import { toggleFavoriteSkill } from "../../services/favorites/actions";
import { selectFavoriteIds } from "../../services/favorites/slice";
import { resolveAssetUrl } from "../../shared/lib/resolveAssetUrl";
import { useDispatch, useSelector } from "../../services/store";
import {
  getCategoryColorBySubcategoryId,
  getLearnColors,
} from "../../shared/lib/skillColors";
import type { IPublicSkillCard } from "../../utils/types";
import type { SkillCardProps } from "../skillcard";
import { SkillCardGroup } from "../skillcard-group";
import { SkillCardGroupHeader } from "../skillcard-group-header";
import { SkillCardSlider } from "../skillcard-slider";
import styles from "./user-section.module.css";
 
interface UserSectionProps {
  title: string;
  items: IPublicSkillCard[];
  actionText?: string;
  onActionClick?: () => void;
  emptyMessage?: string;
  viewMode?: "grid" | "slider";
  isSorted?: boolean;
}
 
export const UserSection: FC<UserSectionProps> = ({
  title,
  items,
  actionText = "Смотреть все",
  onActionClick,
  emptyMessage = "Пользователи не найдены",
  viewMode = "grid",
  isSorted = false,
}) => {
  const dispatch = useDispatch();
  const [sortOrder, setSortOrder] = useState<"new" | "old">("new");
  const currentUser = useSelector((state) => state.auth.currentUser);
  const sentRequests = useSelector((state) => state.requests.sent);
  const favoriteIds = useSelector(selectFavoriteIds);
  const categories = useSelector((state) => state.category.categories);
  const subCategories = useSelector((state) => state.category.subCategories);

  const handleFavoriteClick = (skill: IPublicSkillCard): void => {
    if (!currentUser) {
      return;
    }
    const isCurrentlyFavorite = favoriteIds.includes(skill.id);
    dispatch(toggleFavoriteSkill({ skill, isCurrentlyFavorite }));
  };
 
  // Минимальный фильтр качества данных: скрываем карточки без имени автора
  // (по документации API город/аватар/интересы могут быть null — это нормально
  // и отображается пустым/дефолтным, а не скрывается).
  const validItems = items.filter((item) => Boolean(item.user.name?.trim()));
 
  if (validItems.length === 0) {
    return (
      <section className={styles.section}>
        <SkillCardGroupHeader
          title={title}
          actionText={actionText}
          onActionClick={onActionClick}
          hideAction={!onActionClick}
          isSorted={false}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
        />
 
        <p className={styles.emptyMessage}>{emptyMessage}</p>
      </section>
    );
  }
 
  const cards: SkillCardProps[] = validItems.map((item) => ({
    id: item.id,
    avatar: item.user.avatar ? resolveAssetUrl(item.user.avatar) : userInfo,
    name: item.user.name,
    city: item.user.city?.name ?? "",
    age: item.user.age ?? 0,
    canTeach: item.title,
    teachColor: getCategoryColorBySubcategoryId(
      item.categoryId ?? undefined,
      subCategories,
      categories,
    ),
    wantsToLearn: (item.user.wantToLearn ?? []).map((w) => w.name),
    wantsToLearnColors: getLearnColors(
      (item.user.wantToLearn ?? []).map((w) => w.id),
      subCategories,
      categories,
    ),
    isFavorite: favoriteIds.includes(item.id),
    onFavoriteClick: () => handleFavoriteClick(item),
    disableDetails: String(item.user.id) === String(currentUser?.id),
    exchangeProposed: sentRequests.some(
      (request) => String(request.requiredSkillUserId) === String(item.user.id),
    ),
  }));
 
  return (
    <section className={styles.section}>
      {viewMode === "slider" ? (
        <>
          <SkillCardGroupHeader
            title={title}
            actionText={actionText}
            onActionClick={onActionClick}
            hideAction={!onActionClick}
            isSorted={isSorted}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
          />
          <SkillCardSlider cards={cards} />
        </>
      ) : (
        <SkillCardGroup
          title={title}
          cards={cards}
          actionText={actionText}
          onActionClick={onActionClick}
          hideAction={!onActionClick}
          initialVisibleCount={3}
          isSorted={isSorted}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          infiniteScroll={!onActionClick}
        />
      )}
    </section>
  );
};