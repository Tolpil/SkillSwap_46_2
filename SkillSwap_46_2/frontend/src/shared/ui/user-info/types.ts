import type { OptionType } from "../dropdown/types";

export interface UserInfoProps {
  user?: {
    email: string;
    name: string;
    birthDate: string; // формат "YYYY-MM-DD"
    gender: OptionType | null;
    city: string;
    cityId?: string | null;
    about: string;
    avatar?: string;
    wantToLearnSubcategoryId?: string | null;
  };
  onSave?: (data: {
    email: string;
    name: string;
    birthDate: string;
    gender: OptionType | null;
    city: string;
    cityId: string | null;
    about: string;
    wantToLearnSubcategoryId: string | null;
  }) => void;
  errors?: {
    email?: string;
    name?: string;
    birthDate?: string;
    gender?: string;
    city?: string;
    about?: string;
  };
  loading?: boolean;
  onAvatarEdit?: () => void;
}
