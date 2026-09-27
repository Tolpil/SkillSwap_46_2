import {
  useEffect,
  useMemo,
  useState,
  type FC,
  type SyntheticEvent,
} from "react";
import { format, subYears, isBefore, isAfter, parse } from "date-fns";
import { genderOptions, type AuthorRegisterProps } from "./types";
import styles from "./author-register.module.css";
import userInfo from "../../../../assets/images/user-info.svg";
import { resolveAssetUrl } from "../../../lib/resolveAssetUrl";
import { Button } from "../../button";
import { BasicInput } from "../../input/basic-input";
import { AuthLayout } from "../../auth-layout";
import { Avatar } from "../../avatar";
import { Dropdown } from "../../dropdown";
import type { OptionType } from "../../dropdown/types";
import { DatePicker } from "../../datepicker";
import { useDispatch, useSelector } from "../../../../services/store";
import {
  selectCategories,
  selectSubCategoriesByCategoryId,
} from "../../../../services/category/slice";
import {
  fetchCategories,
  fetchSubCategories,
} from "../../../../services/category/actions";
import { useDebounce } from "../../../hooks/useDebounce";
import { getCities, type ICity } from "../../../../api/cityApi";
import { validateImageFile } from "../../../../api/imageApi";
import { showToast } from "../../../../utils/toast";
import { USE_TOAST } from "../../../../config/apiConfig";

export const AuthorRegister: FC<AuthorRegisterProps> = ({
  avatar,
  setAvatar,
  setAvatarFile,
  name,
  setName,
  birthDate,
  setBirthDate,
  gender,
  setGender,
  city,
  setCity,
  setLearningSkills,
  onNext,
  onBack,
  errorText,
}) => {
  const dispatch = useDispatch();

  const categories = useSelector(selectCategories);
  const getSubcategoriesByCategoryId = useSelector(
    selectSubCategoriesByCategoryId,
  );

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchSubCategories());
  }, [dispatch]);

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

  const cityOptions = useMemo(
    () => cities.map((c) => ({ value: c.id, title: c.name })),
    [cities],
  );

  const [selectedCategory, setSelectedCategory] = useState<OptionType | null>(
    null,
  );
  const [selectedSubcategory, setSelectedSubcategory] =
    useState<OptionType | null>(null);

  const today = new Date();
  const minBirthDateObject = subYears(today, 112);
  const maxBirthDateObject = subYears(today, 18);

  const minBirthDate = format(minBirthDateObject, "yyyy-MM-dd");
  const maxBirthDate = format(maxBirthDateObject, "yyyy-MM-dd");

  const birthDateError = useMemo(() => {
    if (!birthDate) {
      return "";
    }

    const parsed = parse(birthDate, "yyyy-MM-dd", new Date());

    if (Number.isNaN(parsed.getTime())) {
      return "Введите корректную дату";
    }

    if (
      isBefore(parsed, minBirthDateObject) ||
      isAfter(parsed, maxBirthDateObject)
    ) {
      return "Можно указать возраст только от 18 до 112 лет";
    }

    return "";
  }, [birthDate, minBirthDateObject, maxBirthDateObject]);

  const handleAvatarEdit = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const validationError = validateImageFile(file);
      if (validationError) {
        showToast(validationError, "error");
        return;
      }

      setAvatarFile(file);
      setAvatar(URL.createObjectURL(file));
    };
    input.click();
  };

  const availableCategories = categories;

  const availableSubcategories = useMemo(() => {
    if (!selectedCategory) return [];

    return getSubcategoriesByCategoryId(selectedCategory.value).map(
      (sub) => ({
        value: sub.id,
        title: sub.name,
      }),
    );
  }, [selectedCategory, getSubcategoriesByCategoryId]);

  const handleCategoryChange = (option: OptionType | null) => {
    setSelectedCategory(option);
    setSelectedSubcategory(null);
    setLearningSkills([]);
  };

  const handleSubcategoryChange = (option: OptionType | null) => {
    setSelectedSubcategory(option);
    setLearningSkills(option ? [String(option.value)] : []);
  };

  const handleCitySearchChange = (search: string) => {
    setCitySearch(search);
  };

  const handleCityChange = (option: OptionType | null) => {
    setCity(option);
    setCitySearch("");
  };

  const isDisabled = !name.trim() || Boolean(birthDateError);

  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault();

    if (!isDisabled) {
      onNext();
    }
  };

  return (
    <AuthLayout
      type="register"
      currentStep={2}
      totalSteps={2}
      image={userInfo}
      description={{
        title: "Расскажите немного о себе",
        text: "Это поможет другим людям лучше вас узнать, чтобы выбрать для обмена",
      }}
    >
      <form className={styles.form} name="register" onSubmit={handleSubmit}>
        <div className={styles.fields}>
          <Avatar
            src={resolveAssetUrl(avatar)}
            size="large"
            isEditable={true}
            onEdit={handleAvatarEdit}
            className={styles.avatar}
          />
          <BasicInput
            label="Имя"
            placeholder="Введите ваше имя"
            onChange={(value) => setName(value)}
            value={name}
            required
          />
          <div className={styles.birthDate__sex__fields}>
            <div className={styles.form__field}>
              <label className={styles.label}>Дата рождения</label>
              <DatePicker
                placeholder="дд.мм.гггг"
                value={birthDate}
                onChange={setBirthDate}
                minDate={minBirthDate}
                maxDate={maxBirthDate}
                error={Boolean(birthDateError)}
                helperText={birthDateError}
                required
              />
            </div>
            <Dropdown
              title="Пол"
              placeholder="Не указан"
              options={genderOptions}
              selected={gender}
              onChange={setGender}
            />
          </div>
          <Dropdown
            title="Город"
            placeholder="Не указан"
            options={cityOptions}
            selected={city}
            onChange={handleCityChange}
            searchable
            searchPlaceholder="Введите город"
            onSearchChange={handleCitySearchChange}
          />
          <Dropdown
            title="Категория навыка, которому хотите научиться"
            placeholder="Выберите категорию"
            options={availableCategories.map((cat) => ({
              value: cat.id,
              title: cat.name,
            }))}
            selected={selectedCategory}
            onChange={handleCategoryChange}
          />
          <Dropdown
            title="Подкатегория навыка, которому хотите научиться"
            placeholder="Выберите подкатегорию"
            options={availableSubcategories}
            selected={selectedSubcategory}
            onChange={handleSubcategoryChange}
            disabled={!selectedCategory}
          />
        </div>
        <div className={styles.buttons}>
          {errorText && !USE_TOAST && (
            <p className={styles.error}>{errorText}</p>
          )}
          <Button
            variant="secondary"
            onClick={onBack}
            className={styles.button}
          >
            Назад
          </Button>
          <Button
            variant="primary"
            type="submit"
            className={styles.button}
            disabled={isDisabled}
          >
            Зарегистрироваться
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
};