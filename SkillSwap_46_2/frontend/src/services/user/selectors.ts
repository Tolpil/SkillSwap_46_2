import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "../store.ts";
import {
  matchesCity,
  matchesGender,
  matchesSkill,
} from "../../shared/lib/userFilters.ts";
import {
  findMatchingIdsByTitle,
  findMatchingIdsByDescription,
  type ISearchable,
} from "../../utils/search.ts";
import type { ISkill, IUserProfileOnBackend, TId } from "../../utils/types.ts";
import { formatUser } from "../../api/userApi.ts";

export const selectUsers = (state: RootState) => state.user.list;
export const selectSelectedUser = (
  state: RootState,
  skillId?: string | null,
) => {
  if (!skillId) {
    return state.user.selectedUser;
  }

  const userBySkill = state.user.list.find(
    (user) => String(user.userSkill) === String(skillId),
  );

  return userBySkill ?? state.user.selectedUser;
};
export const selectUserLoading = (state: RootState) => state.user.loading;
export const selectUserError = (state: RootState) => state.user.error;

export const selectPopularUsers = createSelector(selectUsers, (users) => {
  const likesCount = users
    .flatMap((u) => u.likesSkillsIds)
    .reduce<Record<string, number>>((acc, skillId) => {
      acc[skillId] = (acc[skillId] ?? 0) + 1;
      return acc;
    }, {});
  return [...users]
    .sort(
      (a, b) =>
        (likesCount[b.userSkill ?? ""] ?? 0) -
        (likesCount[a.userSkill ?? ""] ?? 0),
    )
    .slice(0, 9);
});

export const selectNewestUsers = createSelector(selectUsers, (users) => {
  const now = new Date();
  const oneMonthAgo = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    now.getDate(),
  );

  return users.filter(
    (user) =>
      !!user.createdAt && new Date(user.createdAt).getTime() >= oneMonthAgo.getTime(),
  ); // Только за последний месяц
});

export const selectRecommendedUsers = createSelector(
  selectUsers,
  (state: RootState) => state.auth.currentUser,
  (state: RootState) => state.skills.data,
  (users, currentUser, skills) => {
    const getRandomUsers = (items: typeof users) =>
      [...items].sort(() => Math.random() - 0.5).slice(0, 9);

    if (!currentUser) {
      return getRandomUsers(users);
    }

    const usersWithoutCurrent = users.filter(
      (user) => String(user.id) !== String(currentUser.id),
    );

    const interestedIds = currentUser.interestedSkillsSubcategoriesIds ?? [];

    if (interestedIds.length === 0) {
      return getRandomUsers(usersWithoutCurrent);
    }

    const recommended = usersWithoutCurrent.filter((user) => {
      const skill = skills.find((s) => s.id === user.userSkill);
      return skill && interestedIds.includes(skill.skillSubcategory);
    });

    return getRandomUsers(recommended);
  },
);

const createFilteredUsersSelector = (
  searchFn: (items: ISearchable[], query: string) => TId[],
  excludeFn?: (items: ISearchable[], query: string) => TId[],
) =>
  createSelector(
    selectUsers,
    (state: RootState) => state.filter.subCategoryIds,
    (state: RootState) => state.filter.gender,
    (state: RootState) => state.filter.skillOption,
    (state: RootState) => state.filter.cities,
    (state: RootState) => state.skills.data,
    (state: RootState) => state.filter.searchQuery,
    (
      users,
      subCategoryIds,
      gender,
      skillOption,
      cities,
      skills,
      searchQuery,
    ) => {
      const searchableSkills = skills
        .filter((s): s is ISkill & { id: string } => typeof s.id === "string")
        .map((s) => ({ id: s.id, title: s.title, description: s.description }));
      const matchingIds = searchFn(searchableSkills, searchQuery);

      const excludeIds =
        excludeFn && searchQuery.trim()
          ? excludeFn(searchableSkills, searchQuery)
          : []; // Работа функции для исключения дублей карточек с искомым словом и в имени и в описании скилла

      return users.filter(
        (user) =>
          matchesGender(user, gender) &&
          matchesCity(user, cities) &&
          matchesSkill(user, subCategoryIds, skillOption, skills) &&
          (matchingIds === null ||
            !user.userSkill ||
            matchingIds.includes(user.userSkill)) &&
          !excludeIds.includes(user.userSkill ?? ""),
      );
    },
  );

export const selectFilteredBySkillTitle = createFilteredUsersSelector(
  findMatchingIdsByTitle,
);
// Принимает две функции - вторая нужна для исключения карточек найденных для selectFilteredBySkillTitle
export const selectFilteredBySkillDescription = createFilteredUsersSelector(
  findMatchingIdsByDescription,
  findMatchingIdsByTitle,
);

export const selectSimilarUsers = createSelector(
  [
    (state: RootState) => state.skills.data,
    (_state: RootState, skillId?: string | null) => skillId,
  ],
  (skills, skillId) => {
    if (!skillId) return [];

    const selectedSkill = skills.find((s) => String(s.id) === String(skillId));
    if (!selectedSkill?.user?.id) return [];

    return skills
      .filter(
        (skill) =>
          !!skill.user?.id &&
          skill.skillSubcategory === selectedSkill.skillSubcategory &&
          String(skill.id) !== String(selectedSkill.id) &&
          String(skill.user.id) !== String(selectedSkill.user!.id),
      )
      .map((skill) => {
        const rawUser = skill.user as Partial<IUserProfileOnBackend> & {
          age?: number;
        };

        return {
          ...formatUser(rawUser as IUserProfileOnBackend),
          userSkill: skill.id,
          age: rawUser.age ?? null,
        };
      });
  },
);