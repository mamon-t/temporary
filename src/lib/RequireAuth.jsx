// Гейт для ЧАСТИ приложения (IMPR-85). Приложение целиком может быть публичным
// — режим доступности выбирается при публикации, — а отдельный раздел (кабинет,
// админка) закрыт этим компонентом. Словарь тот же, что у гейта на всё
// приложение, чтобы не держать в голове две модели:
//
//   "public"          — открыто всем;
//   "authenticated"   — любой вошедший через платформенный вход;
//   "owner"           — владелец приложения и его команда.
//
// Любое другое слово — это роль приложения (FEAT-46): `access: "admin"` пускает
// того, кому владелец назначил роль `admin` во вкладке «Пользователи». Роли
// назначаются там, а не из кода, поэтому такой раздел закрыт до первого
// назначения — включая самого владельца. Своя админка владельца — это "owner",
// она работает сразу.
//
// Вход — тот же провайдерский redirect, что и у публикации: `login()` уводит на
// страницу входа платформы, оттуда человек возвращается уже с сессией, и его
// запись появляется во вкладке «Пользователи» в панели приложения. Своей формы
// с паролем у приложения нет и быть не может.
//
// Что этот компонент делает и чего НЕ делает: он решает, что показать. Данные
// защищает не он, а владение записями на гейтвее — чужие приватные записи
// посторонний не прочитает, даже открыв закрытый маршрут напрямую. Поэтому
// нельзя прятать за `owner` вызов функции с `asServiceRole` и считать раздел
// защищённым: проверка должна быть и на сервере.
import { useAuth } from "@/lib/AuthContext.jsx";

// Тексты карточек — русские, как и остальной вход платформы. Приложение на
// другом языке передаёт свои через props (`title` / `description` / `action`).
const COPY = {
  authenticated: {
    title: "Нужен вход",
    description: "Этот раздел открывается после входа.",
    action: "Войти",
  },
  owner: {
    title: "Раздел для владельца",
    description:
      "Этот раздел видит только владелец приложения. Войдите под своей учётной записью.",
    action: "Войти",
  },
  role: {
    title: "Нужен вход",
    description: "Этот раздел открывается после входа.",
    action: "Войти",
  },
  denied: {
    title: "Нет доступа",
    description:
      "Этот раздел доступен не всем. Вы вошли под учётной записью, у которой нет к нему прав.",
  },
};

function Card({ title, description, action, onAction }) {
  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-[var(--muted)]">{description}</p>
        {action ? (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex h-10 items-center justify-center rounded-md bg-[var(--accent)] px-5 text-sm font-medium text-[var(--on-accent)] hover:bg-[var(--accent-hover)] active:bg-[var(--accent-press)]"
          >
            {action}
          </button>
        ) : null}
      </div>
    </main>
  );
}

/**
 * Оборачивает закрытый маршрут или блок страницы.
 *
 * @param {object} props
 * @param {string} [props.access] "public" | "authenticated" | "owner" | имя роли
 * @param {React.ReactNode} props.children что показать допущенному
 * @param {React.ReactNode} [props.fallback] чем заменить карточку отказа
 * @param {string} [props.title]
 * @param {string} [props.description]
 * @param {string} [props.action]
 */
export function RequireAuth({
  access = "authenticated",
  children,
  fallback,
  title,
  description,
  action,
}) {
  const { user, loading, isAuthenticated, isOwner, login } = useAuth();

  if (access === "public") return children;

  // Пока сессия не прочитана, ничего не решаем: иначе владелец на долю секунды
  // видит «нужен вход» и успевает нажать кнопку.
  if (loading) return <main className="min-h-[60vh]" aria-busy="true" />;

  // Незнакомое слово — это роль, а НЕ «просто вход»: иначе опечатка в `access`
  // молча открывала бы раздел любому вошедшему.
  const allowed =
    access === "owner"
      ? isAuthenticated && isOwner
      : access === "authenticated"
        ? isAuthenticated
        : isAuthenticated && user?.role === access;
  if (allowed) return children;
  if (fallback !== undefined) return fallback;

  // Вошёл, но прав нет — предлагать «Войти» бессмысленно, он уже вошёл.
  const copy = isAuthenticated ? COPY.denied : (COPY[access] ?? COPY.role);
  return (
    <Card
      title={title ?? copy.title}
      description={description ?? copy.description}
      action={action ?? copy.action}
      onAction={() => login(window.location.href)}
    />
  );
}

export default RequireAuth;
