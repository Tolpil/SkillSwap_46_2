import { createSlice } from "@reduxjs/toolkit";
import {
  fetchCheckUser,
  fetchLogin,
  fetchLogout,
  fetchProfile,
  fetchRegister,
  fetchUpdateCurrentUser,
  fetchUpdateMyProfile,
  fetchUpdateWantToLearn,
  updatePassword,
} from "./actions.ts";
import {
  appendSkill,
  removeSkill,
} from "../skill/actions";
import type { AuthState } from "./types.ts";
import type { IRealUserMeResponse, IUserProfile } from "../../utils/types.ts";
type NormalizableUser = {
  id?: string;
  email: string;
  name?: string | null;
  birthDate?: string | null;
  birthdate?: string | null;
  gender?: IUserProfile["gender"];
  city?: string | null;
  avatar?: string | null;
  aboutMe?: string;
  likesSkillsIds?: string[];
  userSkill?: string;
  skills?: string[];
  interestedSkillsSubcategoriesIds?: string[];
  createdAt?: string;
  updatedAt?: string;
};

const normalizeCurrentUser = (
  user: NormalizableUser | null | undefined,
): IUserProfile | null => {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name ?? "",
    birthDate: user.birthDate ?? user.birthdate ?? "",
    gender: user.gender,
    city: user.city ?? "",
    avatar: user.avatar ?? "",
    aboutMe: user.aboutMe,
    likesSkillsIds: Array.isArray(user.likesSkillsIds)
      ? user.likesSkillsIds
      : [],
    userSkill: user.userSkill ?? "",
    interestedSkillsSubcategoriesIds: Array.isArray(
      user.interestedSkillsSubcategoriesIds,
    )
      ? user.interestedSkillsSubcategoriesIds
      : [],
    skills: Array.isArray(user.skills) ? user.skills : [],
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

// Реальный GET /users/me отдаёт другую форму, чем IUserProfile (city — объект,
// нет likesSkillsIds/userSkill/interestedSkillsSubcategoriesIds — эти relations
// пока не подгружаются этим эндпоинтом, см. чат с бэком). Приводим к тому,
// что ждёт остальной фронтенд, сохраняя уже известные локальные поля,
// которых в этом ответе нет (не затираем их дефолтами).
const mapRealUserToProfile = (
  user: IRealUserMeResponse,
  previous: IUserProfile | null,
): IUserProfile => ({
  id: user.id,
  email: user.email,
  name: user.name ?? "",
  birthDate: user.birthdate ?? "",
  gender: (user.gender as IUserProfile["gender"]) ?? previous?.gender,
  city: user.city?.name ?? "",
  cityId: user.city?.id ?? previous?.cityId ?? null,
  avatar: user.avatar ?? "",
  aboutMe: user.about ?? previous?.aboutMe ?? "",
  likesSkillsIds: previous?.likesSkillsIds ?? [],
  userSkill: previous?.userSkill ?? "",
  skills: user.skills?.map((skill) => skill.id) ?? previous?.skills ?? [],
  interestedSkillsSubcategoriesIds:
    previous?.interestedSkillsSubcategoriesIds ?? [],
  createdAt: previous?.createdAt ?? "",
  updatedAt: previous?.updatedAt ?? "",
});

const initialState: AuthState = {
  currentUser: null,
  loading: false,
  error: null,
  checkUserLoading: false,
  checkUserError: null,
};

const handlePending = (state: AuthState) => {
  state.loading = true;
  state.error = null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleRejected = (state: AuthState, action: any) => {
  state.loading = false;
  state.error = action.error.message || "Ошибка запроса";
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // register
    builder
      .addCase(fetchRegister.pending, handlePending)
      .addCase(fetchRegister.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = normalizeCurrentUser({
          ...action.payload.user,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      })
      .addCase(fetchRegister.rejected, handleRejected)

      // login
      .addCase(fetchLogin.pending, handlePending)
      .addCase(fetchLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = normalizeCurrentUser(action.payload.user);
      })
      .addCase(fetchLogin.rejected, handleRejected)

      // logout — куку стирает бэкенд (POST /auth/logout), тут только
      // локально чистим currentUser после успешного ответа.
      .addCase(fetchLogout.fulfilled, (state) => {
        state.currentUser = null;
      })
      .addCase(fetchLogout.rejected, handleRejected)

      // profile
      .addCase(fetchProfile.pending, handlePending)
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = mapRealUserToProfile(
          action.payload,
          state.currentUser,
        );
      })
      .addCase(fetchProfile.rejected, handleRejected)

      // updateCurrentUser
      .addCase(fetchUpdateCurrentUser.pending, handlePending)
      .addCase(fetchUpdateCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = mapRealUserToProfile(
          action.payload as unknown as IRealUserMeResponse,
          state.currentUser,
        );
      })
      .addCase(fetchUpdateCurrentUser.rejected, handleRejected)

      // updateMyProfile (шаг 2 регистрации / редактирование профиля)
      .addCase(fetchUpdateMyProfile.pending, handlePending)
      .addCase(fetchUpdateMyProfile.fulfilled, (state) => {
        state.loading = false;
        // Полную синхронизацию currentUser теперь делает fetchProfile
        // (register-page вызывает его в конце регистрации) — он же
        // приводит реальную форму User к IUserProfile через
        // mapRealUserToProfile. Точечный костыль тут больше не нужен.
      })
      .addCase(fetchUpdateMyProfile.rejected, handleRejected)

      // updateWantToLearn (шаг 2 регистрации / редактирование профиля) —
      // бэкенд отдаёт актуальный список категорий, GET /users/me эту связь
      // не возвращает, поэтому синхронизируем currentUser сами.
      .addCase(fetchUpdateWantToLearn.pending, handlePending)
      .addCase(fetchUpdateWantToLearn.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentUser) {
          state.currentUser.interestedSkillsSubcategoriesIds =
            action.payload.map((category) => category.id);
        }
      })
      .addCase(fetchUpdateWantToLearn.rejected, handleRejected)

      // appendSkill/removeSkill — GET /users/me не дёргается заново после
      // создания/удаления навыка, поэтому currentUser.skills синхронизируем
      // здесь же, чтобы hasSkill на skill-page не оставался протухшим до F5.
      .addCase(appendSkill.fulfilled, (state, action) => {
        if (state.currentUser) {
          const newSkillId = action.payload.data.id;
          const skills = state.currentUser.skills ?? [];
          if (!skills.includes(newSkillId)) {
            state.currentUser.skills = [...skills, newSkillId];
          }
        }
      })
      .addCase(removeSkill.fulfilled, (state, action) => {
        if (state.currentUser) {
          state.currentUser.skills = (state.currentUser.skills ?? []).filter(
            (skillId) => skillId !== action.payload,
          );
        }
      });

    builder
      .addCase(fetchCheckUser.pending, (state) => {
        state.checkUserLoading = true;
        state.checkUserError = null;
      })
      .addCase(fetchCheckUser.fulfilled, (state) => {
        state.checkUserLoading = false;
        state.checkUserError = null;
      })
      .addCase(fetchCheckUser.rejected, (state, action) => {
        state.checkUserLoading = false;
        state.checkUserError = action.payload;
      })

      // ИЗМЕНЕНИЕ ПАРОЛЯ
      .addCase(updatePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.code || "Ошибка изменения пароля";
      });
  },
});

export default authSlice.reducer;
