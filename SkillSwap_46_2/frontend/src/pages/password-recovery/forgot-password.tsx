import { useState, type FC, type SyntheticEvent } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "../../shared/ui/auth-layout";
import { BasicInput } from "../../shared/ui/input/basic-input";
import { Button } from "../../shared/ui/button";
import { forgotPassword } from "../../api/authApi";
import { handleError } from "../../utils/errors/errorUtils";
import lightBulb from "../../assets/images/light-bulb.svg";
import styles from "./password-recovery.module.css";

export const ForgotPassword: FC = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(handleError(err).message);
    }
  };

  return (
    <AuthLayout
      type="other"
      title="Восстановление пароля"
      image={lightBulb}
      description={{
        title: "Забыли пароль?",
        text: "Укажите email — мы отправим ссылку для восстановления",
      }}
    >
      {sent ? (
        <div className={styles.success}>
          <p className={styles.success__text}>
            Если аккаунт с таким email существует, мы отправили ссылку для
            восстановления пароля. Проверьте почту.
          </p>
          <Link to="/login" className={styles.link}>
            Вернуться ко входу
          </Link>
        </div>
      ) : (
        <form className={styles.form} name="forgot-password" onSubmit={handleSubmit}>
          <div className={styles.fields}>
            <BasicInput
              label="Email"
              placeholder="Введите email"
              value={email}
              onChange={setEmail}
              error={!!error && !email}
              required
            />
            {error && <p className={styles.error}>{error}</p>}
          </div>

          <Button variant="primary" type="submit">
            Отправить ссылку
          </Button>

          <Link to="/login" className={styles.link}>
            Вспомнил пароль — вернуться ко входу
          </Link>
        </form>
      )}
    </AuthLayout>
  );
};