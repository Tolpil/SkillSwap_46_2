import { createSlice } from "@reduxjs/toolkit";
import type { IPublicSkillCard, TId } from "../../utils/types";
import { fetchFavoriteSkills, toggleFavoriteSkill } from "./actions";

export interface FavoritesState {
  ids: TId[];
  items: IPublicSkillCard[];
}

const initialState: FavoritesState = { ids: [], items: [] };

export const favoritesSlice = createSlice({
  name: "favorites",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchFavoriteSkills.fulfilled, (state, action) => {
      state.items = action.payload;
      state.ids = action.payload.map((skill) => skill.id);
    });

    builder.addCase(toggleFavoriteSkill.fulfilled, (state, action) => {
      const { skill, isFavorite } = action.payload;
      if (isFavorite) {
        if (!state.ids.includes(skill.id)) {
          state.ids.push(skill.id);
          state.items.push(skill);
        }
      } else {
        state.ids = state.ids.filter((id) => id !== skill.id);
        state.items = state.items.filter((item) => item.id !== skill.id);
      }
    });
  },
  selectors: {
    selectFavoriteIds: (state: FavoritesState) => state.ids,
    selectFavoriteItems: (state: FavoritesState) => state.items,
  },
});

export const { selectFavoriteIds, selectFavoriteItems } =
  favoritesSlice.selectors;
export default favoritesSlice.reducer;