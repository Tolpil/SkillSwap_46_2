import React, { useEffect, useState } from "react";
import { Icon } from "../../../shared/ui/icon";
import { Search } from "../../../shared/ui/search";
import { getCities, type ICity } from "../../../api/cityApi";
import type { TCityCheckboxGroupProps } from "./types";
import styles from "./checkbox-group.module.css";

// Сколько городов показывать до нажатия "Все города"
const VISIBLE_CITIES_COUNT = 5;

export const CityCheckboxGroup: React.FC<TCityCheckboxGroupProps> = ({
  value = [],
  onChange,
}) => {
  const [showAll, setShowAll] = useState(false);
  const [cities, setCities] = useState<ICity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearchActive, setIsSearchActive] = useState(false);

  const loadCities = async (search?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const results = search
        ? await getCities(search)
        : await getCities(undefined, { major: true });
      setCities(results);
    } catch (err) {
      console.error("Не удалось загрузить города", err);
      setCities([]);
      setError("Не удалось загрузить список городов");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCities();
  }, []);

  const handleSearch = (query: string) => {
    const trimmed = query.trim();
    setIsSearchActive(Boolean(trimmed));
    setShowAll(false);
    loadCities(trimmed || undefined);
  };

  const handleClearSearch = () => {
    setIsSearchActive(false);
    setShowAll(false);
    loadCities();
  };

  const handleCityChange = (cityName: string) => {
    const newValue = value.includes(cityName)
      ? value.filter((c) => c !== cityName)
      : [...value, cityName];
    onChange?.(newValue);
  };

  const handleSeeAll = () => {
    setShowAll((prev) => !prev);
  };

  const visibleCities = showAll
    ? cities
    : cities.slice(0, VISIBLE_CITIES_COUNT);
  const hasMoreCities = cities.length > VISIBLE_CITIES_COUNT;

  return (
    <div className={styles.container}>
      <Search
        onSearch={handleSearch}
        onClear={handleClearSearch}
        placeholder="Город"
        aria-label="Поиск города"
      />

      <div className={styles.checkboxgroup}>
        {isLoading && cities.length === 0 ? (
          <p className={styles.label}>Загрузка...</p>
        ) : cities.length === 0 ? (
          <p className={styles.label}>
            {error ?? (isSearchActive ? "Города не найдены" : "Нет доступных городов")}
          </p>
        ) : (
          visibleCities.map((city) => {
            const isChecked = value.includes(city.name);

            return (
              <label key={city.id} className={styles.option}>
                <input
                  type="checkbox"
                  value={city.name}
                  checked={isChecked}
                  onChange={() => handleCityChange(city.name)}
                  className={styles.input}
                />
                <span className={styles.checkbox}>
                  <Icon
                    name={isChecked ? "checkbox-done" : "checkbox-empty"}
                    size={20}
                    aria-hidden="true"
                  />
                </span>
                <span className={styles.label}>{city.name}</span>
              </label>
            );
          })
        )}
      </div>

      {/* Кнопка "Все города" — показываем, если городов больше чем VISIBLE_CITIES_COUNT */}
      {!isLoading && hasMoreCities && (
        <button
          type="button"
          className={styles["see-all-button"]}
          onClick={handleSeeAll}
          aria-label={
            showAll ? "Свернуть список городов" : "Показать все города"
          }
        >
          <span>{showAll ? "Свернуть" : "Все города"}</span>
          <Icon
            name={showAll ? "chevron-up" : "chevron-down"}
            size={20}
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  );
};