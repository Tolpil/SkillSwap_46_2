import { useState, type FC, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthLayout } from "../../shared/ui/auth-layout";
import { PasswordInput } from "../../shared/ui/input/password-input";
import { Button } from "../../shared/ui/button";
import { resetPassword } from "../../api/authApi";
import { handleError } from "../../utils/errors/errorUtils";
import lightBulb from "../../assets/images/light-bulb.svg";
import styles from "./password-recovery.module.css";

export const ResetPassword: FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Ссылка недействительна: отсутствует токен восстановления");
      return;
    }

    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(handleError(err).message);
    }
  };

  return (
    <AuthLayout
      type="other"
      title="Новый пароль"
      image={lightBulb}
      description={{
        title: "Придумайте новый пароль",
        text: "Минимум 8 символов. После смены пароля все сессии будут завершены",
      }}
    >
      {done ? (
        <div className={styles.success}>
          <p className={styles.success__text}>Пароль успешно изменён.</p>
          <Link to="/login" className={styles.link}>
            Войти с новым паролем
          </Link>
        </div>
      ) : (
        <form className={styles.form} name="reset-password" onSubmit={handleSubmit}>
          <div className={styles.fields}>
            <PasswordInput
              label="Новый пароль"
              placeholder="Введите новый пароль"
              value={password}
              onChange={setPassword}
              error={!!error && !password}
              required
            />
            {error && <p className={styles.error}>{error}</p>}
          </div>

          <Button variant="primary" type="submit">
            Сохранить пароль
          </Button>
        </form>
      )}
    </AuthLayout>
  );
};