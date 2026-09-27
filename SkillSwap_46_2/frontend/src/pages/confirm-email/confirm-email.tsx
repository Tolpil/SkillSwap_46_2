import { useEffect, useState, type FC } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthLayout } from "../../shared/ui/auth-layout";
import { confirmEmail } from "../../api/authApi";
import { handleError } from "../../utils/errors/errorUtils";
import lightBulb from "../../assets/images/light-bulb.svg";
import styles from "../password-recovery/password-recovery.module.css";

type ConfirmStatus = "loading" | "success" | "error";

export const ConfirmEmail: FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState<ConfirmStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    if (!token) {
      setStatus("error");
      setError("Отсутствует токен подтверждения");
      return;
    }

    confirmEmail(token)
      .then(() => {
        if (isActive) setStatus("success");
      })
      .catch((err: unknown) => {
        if (isActive) {
          setStatus("error");
          setError(handleError(err).message);
        }
      });

    return () => {
      isActive = false;
    };
  }, [token]);

  return (
    <AuthLayout
      type="other"
      title="Подтверждение email"
      image={lightBulb}
      description={{
        title: "Почти готово!",
        text: "Осталось подтвердить адрес электронной почты",
      }}
    >
      {status === "loading" && (
        <div className={styles.success}>
          <p className={styles.success__text}>Подтверждаем email…</p>
        </div>
      )}

      {status === "success" && (
        <div className={styles.success}>
          <p className={styles.success__text}>
            Email подтверждён. Теперь вам доступны все возможности сервиса.
          </p>
          <Link to="/" className={styles.link}>
            Перейти на главную
          </Link>
        </div>
      )}

      {status === "error" && (
        <div className={styles.success}>
          <p className={styles.error}>
            {error ?? "Не удалось подтвердить email"}
          </p>
          <Link to="/login" className={styles.link}>
            Вернуться ко входу
          </Link>
        </div>
      )}
    </AuthLayout>
  );
};