import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  changePassword,
  checkUser,
  getProfile,
  loginUser,
  logoutUser,
  registerUser,
} from "../../api/authApi.ts";
import type { TLoginUserData, TUpdateUserData } from "../../utils/types.ts";
import { updateMyProfile, updateWantToLearn } from "../../api/userApi.ts";
import type { IUpdateProfileData } from "../../utils/types.ts";
 
 
export const fetchRegister = createAsyncThunk(
  "auth/register",
  async (data: TLoginUserData, { rejectWithValue }) => {
    try {
      return await registerUser(data);
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);
 
export const fetchLogin = createAsyncThunk(
  "auth/login",
  async (data: TLoginUserData, { rejectWithValue }) => {
    try {
      return await loginUser(data);
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);
 
export const fetchCheckUser = createAsyncThunk(
  "auth/check-user",
  async (data: TLoginUserData, { rejectWithValue }) => {
    try {
      return await checkUser(data);
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);
 
export const fetchProfile = createAsyncThunk(
  "auth/profile",
  async (_, { rejectWithValue }) => {
    try {
      return await getProfile();
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);
 
export const fetchUpdateCurrentUser = createAsyncThunk(
  "auth/updateCurrentUser",
  async (
    payload: Partial<TUpdateUserData> & { cityId?: string | null },
    { rejectWithValue },
  ) => {
    try {
      // Приводим фронт-формат профиля (birthDate/aboutMe/gender/cityId) к
      // бэкенд-формату PATCH /users/me (birthdate/about/cityId/gender enum),
      // чтобы сервер не отвечал 400 (см. #267).
      const updateData: Partial<IUpdateProfileData> = {};

      if (payload.name !== undefined) updateData.name = payload.name;
      if (payload.email !== undefined) updateData.email = payload.email;
      if (payload.birthDate !== undefined) updateData.birthdate = payload.birthDate;
      if (payload.gender !== undefined) updateData.gender = payload.gender;
      if (payload.aboutMe !== undefined) updateData.about = payload.aboutMe;
      if (payload.avatar !== undefined) updateData.avatar = payload.avatar;
      if (payload.cityId !== undefined) updateData.cityId = payload.cityId;

      return await updateMyProfile(updateData);
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);
 
/** ОБНОВЛЕНИЕ ПАРОЛЯ ПОЛЬЗОВАТЕЛЯ */
export const updatePassword = createAsyncThunk(
  "auth/update-password",
  async (newPassword: string, { rejectWithValue }) => {
    try {
      await changePassword(newPassword);
      return newPassword;
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);
 
 
export const fetchUpdateMyProfile = createAsyncThunk(
  "auth/updateMyProfile",
  async (payload: IUpdateProfileData, { rejectWithValue }) => {
    try {
      return await updateMyProfile(payload);
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);
 
export const fetchUpdateWantToLearn = createAsyncThunk(
  "auth/updateWantToLearn",
  async (categoryIds: string[], { rejectWithValue }) => {
    try {
      return await updateWantToLearn(categoryIds);
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

export const fetchLogout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await logoutUser();
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);