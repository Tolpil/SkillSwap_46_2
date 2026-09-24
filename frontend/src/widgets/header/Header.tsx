import { useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { setSearchQuery } from "../../services/filter/slice.ts";
import { useDispatch, useSelector } from "../../services/store.ts";
import { fetchCategories } from "../../services/category/actions";
import { Avatar } from "../../shared/ui/avatar";
import { resolveAssetUrl } from "../../shared/lib/resolveAssetUrl";
import { getCategoryColorById } from "../../shared/lib/skillColors";
import { Button } from "../../shared/ui/button";
import { Logo } from "../../shared/ui/logo";
import { Popover } from "../../shared/ui/popover";
import { ProfileMenu } from "../../shared/ui/profile-menu";
import { Search } from "../../shared/ui/search";
import { SkillCategoryGroup } from "../../shared/ui/skill-category-group";
import type { TSkillCategoryProps } from "../../shared/ui/skill-category/types";
import styles from "./header.module.css";
import { fetchLogout } from "../../services/auth/actions";
import { HeaderIcons } from "../../shared/ui/header-icons";
 
 
export function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
 
  const isAuthenticated = useSelector((state) => !!state.auth.currentUser);
  const user = useSelector((state) => state.auth.currentUser);
  const categories = useSelector((state) => state.category.categories);
  const isCategoriesLoading = useSelector((state) => state.category.loading);
  const hasTriedFetchingCategories = useRef(false);

  useEffect(() => {
    if (
      categories.length === 0 &&
      !isCategoriesLoading &&
      !hasTriedFetchingCategories.current
    ) {
      hasTriedFetchingCategories.current = true;
      dispatch(fetchCategories());
    }
  }, [categories.length, dispatch, isCategoriesLoading]);

  const catalogCategories = useMemo<TSkillCategoryProps[]>(
    () =>
      categories.map((category) => ({
        title: category.name,
        iconName: "idea",
        iconBackgroundColor: getCategoryColorById(category.id, categories),
        skills: category.subcategories.map((subcategory) => subcategory.name),
      })),
    [categories],
  );
 
  const handleSearch = (value: string) => {
    dispatch(setSearchQuery(value));
 
    if (location.pathname !== "/") {
      navigate("/");
    }
  };
 
  const handleClear = () => {
    dispatch(setSearchQuery(""));
  };
 
  const handleLogoutClick = async () => {
    await dispatch(fetchLogout());
    window.location.href = "/";
  };
 
  return (
    <header className={styles.header}>
      <Logo />
 
      <nav className={styles.nav} aria-label="Основная навигация">
        <ul className={styles.navList}>
          <li>
            <Button variant="text" className={styles.navLink}>
              О проекте
            </Button>
          </li>
 
          <li>
            <Popover
              trigger={
                <Button
                  variant="text"
                  className={styles.catalogButton}
                  icon="chevron-down"
                  iconPosition="right"
                  iconSize={20}
                >
                  Все навыки
                </Button>
              }
              position="bottom"
              offset={12}
              closeOnEscape={true}
              closeOnOverlayClick={true}
              backdropType="transparent"
            >
              <div
                style={{
                  padding: "32px",
                  maxWidth: "1136px",
                  minWidth: "800px",
                  maxHeight: "80vh",
                  overflowY: "auto",
                  backgroundColor: "var(--color-bg-card)",
                  borderRadius: "12px",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 24px 0",
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                  }}
                >
                  Категории навыков
                </h3>
                <SkillCategoryGroup categories={catalogCategories} />
              </div>
            </Popover>
          </li>
        </ul>
      </nav>
 
      <div className={styles.searchWrapper}>
        <Search
          onSearch={handleSearch}
          onClear={handleClear}
          placeholder="Искать навык"
          aria-label="Поиск навыков"
        />
      </div>
 
      <HeaderIcons isUserAuth={isAuthenticated} />
 
      {isAuthenticated ? (
        <Popover
          trigger={
            <div className={styles.userTrigger}>
              <span className={styles.userName}>{user?.name}</span>
              <Avatar
                size="small"
                src={resolveAssetUrl(user?.avatar)}
                name={user?.name}
                isAuthorized={true}
              />
            </div>
          }
          position="bottom"
          offset={8}
          closeOnEscape={true}
          closeOnOverlayClick={true}
          backdropType="transparent"
        >
          {({ close }) => (
            <ProfileMenu
              onLogoutClick={handleLogoutClick}
              onClosePopover={close}
            />
          )}
        </Popover>
      ) : (
        <div className={styles.authButtons}>
          <Button
            variant="secondary"
            className={styles.loginButton}
            onClick={() =>
              navigate("/login", { state: { from: location.pathname } })
            }
          >
            Войти
          </Button>
 
          <Button
            variant="primary"
            className={styles.registerButton}
            onClick={() =>
              navigate("/registration", { state: { from: location.pathname } })
            }
          >
            Зарегистрироваться
          </Button>
        </div>
      )}
    </header>
  );
}