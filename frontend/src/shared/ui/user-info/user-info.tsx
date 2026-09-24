import { useState, useEffect, useMemo, type FC } from "react";
import clsx from "clsx";
import { Avatar } from "../avatar";
import { BasicInput } from "../input/basic-input";
import { DatePicker } from "../datepicker";
import { Dropdown } from "../dropdown";
import { Button } from "../button";
import { Icon } from "../icon";
import { PasswordInput } from "../input";
import type { UserInfoProps } from "./types";
import type { OptionType } from "../dropdown/types";
import { useDispatch, useSelector } from "../../../services/store";
import { updatePassword } from "../../../services/auth/actions";
import { getCities, type ICity } from "../../../api/cityApi";
import { useDebounce } from "../../hooks/useDebounce";
import {
  selectCategories,
  selectSubCategories,
  selectSubCategoriesByCategoryId,
} from "../../../services/category/slice";
import {
  fetchCategories,
  fetchSubCategories,
} from "../../../services/category/actions";
import styles from "./user-info.module.css";

const genderOptions: OptionType[] = [
  { value: "MALE", title: "Мужской" },
  { value: "FEMALE", title: "Женский" },
  { value: "UNSPECIFIED", title: "Другой" },
];

const validatePassword = (password: string): string => {
  if (!password) {
    return "Пароль обязателен";
  }

  if (password.length < 8) {
    return "Минимум 8 символов";
  }

  if (!/\p{Lu}/u.test(password)) {
    return "Должна быть заглавная буква";
  }

  if (!/[0-9]/.test(password)) {
    return "Должна быть цифра";
  }

  return "";
};

export const UserInfo: FC<UserInfoProps> = ({
  user,
  onSave,
  errors = {},
  loading = false,
  onAvatarEdit,
}) => {
  const dispatch = useDispatch();

  const categories = useSelector(selectCategories);
  const subCategories = useSelector(selectSubCategories);
  const getSubcategoriesByCategoryId = useSelector(
    selectSubCategoriesByCategoryId,
  );

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchSubCategories());
  }, [dispatch]);

  const [email, setEmail] = useState(user?.email ?? "");
  const [name, setName] = useState(user?.name ?? "");
  const [birthDate, setBirthDate] = useState(user?.birthDate ?? "");
  const [gender, setGender] = useState<OptionType | null>(user?.gender ?? null);
  const [city, setCity] = useState(user?.city ?? "");
  const [cityId, setCityId] = useState<string | null>(user?.cityId ?? null);
  const [about, setAbout] = useState(user?.about ?? "");

  const initialSubcategory = useMemo<OptionType | null>(() => {
    if (!user?.wantToLearnSubcategoryId) {
      return null;
    }

    const subcategory = subCategories.find(
      (sub) => sub.id === user.wantToLearnSubcategoryId,
    );

    return subcategory
      ? { value: subcategory.id, title: subcategory.name }
      : null;
  }, [user, subCategories]);

  const initialCategory = useMemo<OptionType | null>(() => {
    if (!user?.wantToLearnSubcategoryId) {
      return null;
    }

    const subcategory = subCategories.find(
      (sub) => sub.id === user.wantToLearnSubcategoryId,
    );
    const category = subcategory
      ? categories.find((cat) => cat.id === subcategory.skillCategoryId)
      : undefined;

    return category ? { value: category.id, title: category.name } : null;
  }, [user, subCategories, categories]);

  const [categoryOverride, setCategoryOverride] = useState<
    OptionType | null | undefined
  >(undefined);
  const [subcategoryOverride, setSubcategoryOverride] = useState<
    OptionType | null | undefined
  >(undefined);

  const selectedCategory =
    categoryOverride !== undefined ? categoryOverride : initialCategory;
  const selectedSubcategory =
    subcategoryOverride !== undefined ? subcategoryOverride : initialSubcategory;

  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [citySearch, setCitySearch] = useState("");
  const [cities, setCities] = useState<ICity[]>([]);

  const debouncedCitySearch = useDebounce(citySearch, 300);

  useEffect(() => {
    let isCancelled = false;

    const loadCities = async () => {
      try {
        const results = await getCities(debouncedCitySearch || undefined);
        if (!isCancelled) {
          setCities(results);
        }
      } catch (err) {
        console.error("Не удалось загрузить города", err);
        if (!isCancelled) {
          setCities([]);
        }
      }
    };

    loadCities();

    return () => {
      isCancelled = true;
    };
  }, [debouncedCitySearch]);

  const cityOptions: OptionType[] = useMemo(() => {
    const loaded = cities.map((c) => ({ value: c.id, title: c.name }));
    if (city && !loaded.some((option) => option.title === city)) {
      return [{ value: cityId ?? city, title: city }, ...loaded];
    }
    return loaded;
  }, [cities, city, cityId]);

  const selectedCityOption = useMemo(
    () => cityOptions.find((option) => option.title === city) ?? null,
    [cityOptions, city],
  );

  const handleCitySearchChange = (search: string) => {
    setCitySearch(search);
  };

  const handleCityChange = (option: OptionType | null) => {
    setCity(option?.title ?? "");
    setCityId(option?.value ?? null);
    setCitySearch("");
  };

  const availableSubcategories: OptionType[] = useMemo(() => {
    if (!selectedCategory) {
      return [];
    }

    return getSubcategoriesByCategoryId(selectedCategory.value).map(
      (sub) => ({ value: sub.id, title: sub.name }),
    );
  }, [selectedCategory, getSubcategoriesByCategoryId]);

  const handleCategoryChange = (option: OptionType | null) => {
    setCategoryOverride(option);
    setSubcategoryOverride(null);
  };

  const handleSubcategoryChange = (option: OptionType | null) => {
    setSubcategoryOverride(option);
  };

  const handleSave = () => {
    onSave?.({
      email,
      name,
      birthDate,
      gender,
      city,
      cityId,
      about,
      wantToLearnSubcategoryId: selectedSubcategory?.value ?? null,
    });
  };

  const handleCancelPasswordChange = () => {
    setShowPasswordChange(false);
    setNewPassword("");
    setPasswordError("");
  };

  const handlePasswordSave = async () => {
    const validationError = validatePassword(newPassword);

    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    try {
      await dispatch(updatePassword(newPassword)).unwrap();
      handleCancelPasswordChange();
    } catch {
      setPasswordError("Не удалось изменить пароль");
    }
  };

  return (
    <div className={clsx(styles.userInfo, loading && styles.loading)}>
      <div className={styles.avatarContainer}>
        <Avatar
          size="profile"
          src={user?.avatar}
          name={name}
          isAuthorized={true}
          isEditable={true}
          onEdit={onAvatarEdit}
        />
      </div>

      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        aria-label="Редактирование профиля пользователя"
      >
        <div className={styles.field}>
          <BasicInput
            label="Почта"
            placeholder="Введите email"
            value={email}
            onChange={setEmail}
            error={errors.email}
            required
            rightIcon={
              <Icon
                name="edit"
                size={24}
                className={styles.editIcon}
                alt="Редактирование поля почты"
              />
            }
          />

          <button
            type="button"
            className={styles.changePasswordLink}
            onClick={() => {
              setShowPasswordChange(!showPasswordChange);
              setPasswordError("");
              setNewPassword("");
            }}
            aria-expanded={showPasswordChange}
            aria-controls="password-change-container"
          >
            Изменить пароль
          </button>

          {showPasswordChange && (
            <div
              id="password-change-container"
              className={styles.passwordChangeContainer}
            >
              <PasswordInput
                label="Новый пароль"
                placeholder="Придумайте новый пароль"
                value={newPassword}
                onChange={(value) => {
                  setNewPassword(value);
                  setPasswordError("");
                }}
                error={passwordError}
                required
              />

              <div className={styles.passwordActions}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancelPasswordChange}
                >
                  Отмена
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  onClick={handlePasswordSave}
                  disabled={loading}
                >
                  Сохранить пароль
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.field}>
          <BasicInput
            label="Имя"
            placeholder="Введите ваше имя"
            value={name}
            onChange={setName}
            error={errors.name}
            required
            rightIcon={
              <Icon
                name="edit"
                size={24}
                className={styles.editIcon}
                alt="Редактирование поля имени"
              />
            }
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <div className={styles.fieldLabel}>Дата рождения</div>
            <DatePicker
              value={birthDate}
              onChange={setBirthDate}
              placeholder="дд.мм.гггг"
              error={Boolean(errors.birthDate)}
              helperText={errors.birthDate}
              disableFuture
            />
          </div>

          <div className={styles.field}>
            <Dropdown
              title="Пол"
              placeholder="Выберите пол"
              options={genderOptions}
              selected={gender}
              onChange={setGender}
              error={Boolean(errors.gender)}
            />
          </div>
        </div>

        <div className={styles.field}>
          <Dropdown
            title="Город"
            placeholder="Выберите город"
            options={cityOptions}
            selected={selectedCityOption}
            onChange={handleCityChange}
            error={Boolean(errors.city)}
            searchable
            searchPlaceholder="Введите город"
            onSearchChange={handleCitySearchChange}
          />
        </div>

        <div className={styles.field}>
          <Dropdown
            title="Категория навыка, которому хотите научиться"
            placeholder="Выберите категорию"
            options={categories.map((cat) => ({
              value: cat.id,
              title: cat.name,
            }))}
            selected={selectedCategory}
            onChange={handleCategoryChange}
          />
        </div>

        <div className={styles.field}>
          <Dropdown
            title="Подкатегория навыка, которому хотите научиться"
            placeholder="Выберите подкатегорию"
            options={availableSubcategories}
            selected={selectedSubcategory}
            onChange={handleSubcategoryChange}
            disabled={!selectedCategory}
          />
        </div>

        <div className={styles.field}>
          <BasicInput
            label="О себе"
            placeholder="Расскажите о себе"
            value={about}
            onChange={setAbout}
            error={errors.about}
            multiline
            rows={4}
            rightIcon={
              <Icon
                name="edit"
                size={24}
                className={styles.editIcon}
                alt="Редактирование поля о себе"
              />
            }
          />
        </div>

        <div className={styles.actions}>
          <Button variant="primary" type="submit" disabled={loading} fullWidth>
            {loading ? "Сохранение..." : "Сохранить"}
          </Button>
        </div>
      </form>
    </div>
  );
};