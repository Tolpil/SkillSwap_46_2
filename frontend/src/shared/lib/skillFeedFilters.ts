import type { IPublicSkillCard } from "../../utils/types";
import type {
  TGenderOption,
  TSkillOption,
} from "../../widgets/filter-bar/radio-groups/types";
import { GENDER_FILTER_MAP } from "./genderFilterMap";

export const matchesCityFeed = (
  item: IPublicSkillCard,
  cities: string[],
): boolean =>
  cities.length === 0 ||
  (!!item.user.city && cities.includes(item.user.city.name));

export const matchesGenderFeed = (
  item: IPublicSkillCard,
  gender: TGenderOption,
): boolean => {
  if (gender === "all") return true;
  return item.user.gender === GENDER_FILTER_MAP[gender];
};

export const matchesSkillFeed = (
  item: IPublicSkillCard,
  subCategoryIds: string[],
  skillOption: TSkillOption,
): boolean => {
  if (subCategoryIds.length === 0) return true;

  const canTeach =
    !!item.categoryId && subCategoryIds.includes(item.categoryId);
  const wantsToLearn = (item.user.wantToLearn ?? []).some((w) =>
    subCategoryIds.includes(w.id),
  );

  if (skillOption === "can-teach") return canTeach;
  if (skillOption === "want-to-learn") return wantsToLearn;

  return canTeach || wantsToLearn; // 'all'
};
