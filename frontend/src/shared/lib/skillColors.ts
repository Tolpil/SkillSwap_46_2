import type { TId } from "../../utils/types";

// Color is assigned by a category's position in the full categories list
// (not by name or a hash of its id), so it stays distinct across categories
// as long as their count doesn't exceed the palette size below.
const CATEGORY_COLORS = [
  "var(--color-category-business)",
  "var(--color-category-creative)",
  "var(--color-category-languages)",
  "var(--color-category-education)",
  "var(--color-category-home)",
  "var(--color-category-health)",
  "var(--color-category-it)",
] as const;

const DEFAULT_LEARN_COLOR = CATEGORY_COLORS[0];

type WithId = {
  id?: TId;
};

type WithSkillCategoryId = WithId & {
  skillCategoryId?: TId;
};

type WithSkillSubcategory = WithId & {
  skillSubcategory?: TId | null;
};

export const getCategoryColorById = <TCategory extends WithId>(
  categoryId: TId,
  categories: ReadonlyArray<TCategory>,
): string => {
  const index = categories.findIndex((category) => category.id === categoryId);

  if (index === -1) {
    return DEFAULT_LEARN_COLOR;
  }

  return CATEGORY_COLORS[index % CATEGORY_COLORS.length] ?? DEFAULT_LEARN_COLOR;
};
export const getCategoryColorBySubcategoryId = <
  TSubCategory extends WithSkillCategoryId,
  TCategory extends WithId,
>(
  subcategoryId: TId | undefined,
  subCategories: ReadonlyArray<TSubCategory>,
  categories: ReadonlyArray<TCategory>,
): string | undefined => {
  if (!subcategoryId) {
    return undefined;
  }

  const subCategory = subCategories.find((item) => item.id === subcategoryId);

  if (!subCategory?.skillCategoryId) {
    return undefined;
  }

  const category = categories.find(
    (item) => item.id === subCategory.skillCategoryId,
  );

  if (!category?.id) {
    return undefined;
  }

  return getCategoryColorById(category.id, categories);
};

export const getTeachColor = <
  TSkill extends WithSkillSubcategory,
  TSubCategory extends WithSkillCategoryId,
  TCategory extends WithId,
>(
  skillId: TId | undefined,
  skills: ReadonlyArray<TSkill>,
  subCategories: ReadonlyArray<TSubCategory>,
  categories: ReadonlyArray<TCategory>,
): string | undefined => {
  if (!skillId) {
    return undefined;
  }

  const skill = skills.find((item) => item.id === skillId);

  if (!skill?.skillSubcategory) {
    return undefined;
  }

  return getCategoryColorBySubcategoryId(
    skill.skillSubcategory,
    subCategories,
    categories,
  );
};

export const getLearnColors = <
  TSubCategory extends WithSkillCategoryId,
  TCategory extends WithId,
>(
  subcategoryIds: TId[],
  subCategories: ReadonlyArray<TSubCategory>,
  categories: ReadonlyArray<TCategory>,
): string[] =>
  subcategoryIds.map((subcategoryId) => {
    return (
      getCategoryColorBySubcategoryId(
        subcategoryId,
        subCategories,
        categories,
      ) ?? DEFAULT_LEARN_COLOR
    );
  });
