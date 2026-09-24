import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  addSkillToFavorites,
  getFavoriteSkills,
  removeSkillFromFavorites,
} from "../../api/skillApi";
import type { IPublicSkillCard } from "../../utils/types";


export const toggleFavoriteSkill = createAsyncThunk(
  "favorites/toggle",
  async ({
    skill,
    isCurrentlyFavorite,
  }: {
    skill: IPublicSkillCard;
    isCurrentlyFavorite: boolean;
  }) => {
    if (isCurrentlyFavorite) {
      await removeSkillFromFavorites(skill.id);
      return { skill, isFavorite: false };
    }
    await addSkillToFavorites(skill.id);
    return { skill, isFavorite: true };
  },
);


export const fetchFavoriteSkills = createAsyncThunk(
  "favorites/fetchList",
  async (_, { rejectWithValue }) => {
    try {
      return await getFavoriteSkills();
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);