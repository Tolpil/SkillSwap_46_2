import type { TGender } from "../../utils/types";
import type { TGenderOption } from "../../widgets/filter-bar/radio-groups/types";

export const GENDER_FILTER_MAP: Record<Exclude<TGenderOption, "all">, TGender> = {
  male: "MALE",
  female: "FEMALE",
};
