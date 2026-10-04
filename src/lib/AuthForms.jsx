// Готовые формы для СВОИХ страниц входа приложения (FEAT-68).
//
// Что здесь есть и чего нет. Здесь — вся механика, в которой сгенерированный
// код ошибается: состав полей, список рабочих кнопок способов входа (их
// приносит платформа — рисовать «Google» там, где ключей нет, значит увести
// человека в 403), разбор ВСЕХ причин отказа, «проверьте почту» после регистрации,
// блокировка кнопки на время запроса. Здесь НЕТ вёрстки страницы: ни фона, ни
// шапки, ни колонок — форма занимает столько, сколько ей дали, и берёт токены
// темы приложения. Оформление — дело страницы, которая её вставила.
//
// Как этим пользоваться:
//
//   // src/pages/Login.jsx
//   import { LoginForm } from "@/lib/AuthForms.jsx";
//   export default function Login() {
//     return (
//       <main className="min-h-screen grid place-items-center px-4">
//         <div className="w-full max-w-sm space-y-6">
//           <h1 className="text-2xl font-semibold">Вход</h1>
//           <LoginForm registerHref="/register" />
//         </div>
//       </main>
//     );
//   }
//
// и маршруты в `src/routes.jsx`:
//
//   { path: "/login",    label: "Вход",        element: <Login /> },
//   { path: "/register", label: "Регистрация", element: <Register /> },
//
// Маршруты обязательны: по ним сборка понимает, что вход теперь у приложения,
// и платформа перестаёт подменять `{app}/login` своей формой. Ровно поэтому
// объявлять это где-то ещё не нужно.
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext.jsx";

// Тексты отказов — по причинам, которые возвращает платформа. Своя копия
// нужна редко (другой язык приложения): передайте `copy` с нужными ключами.
const REASONS = {
  invalid: "Неверная почта или пароль.",
  unverified:
    "Почта не подтверждена. Мы отправили письмо со ссылкой ещё раз — проверьте ящик.",
  conflict: "Такая почта уже зарегистрирована. Попробуйте войти.",
  weak_password: "Пароль слишком простой — нужно не меньше 8 символов.",
  rate_limit: "Слишком много попыток. Подождите немного и повторите.",
  method_disabled:
    "Этот способ входа отключён. Попробуйте другой из доступных на странице.",
  bad_request: "Заполните все поля.",
  unknown: "Не получилось. Попробуйте ещё раз.",
};

// Подписи кнопок способов входа. Набор способов приносит платформа
// (`authMethods()`), здесь только слова: у мессенджеров и телефона свой экран
// на платформе, но для страницы это такая же кнопка «уйти входить».
const METHOD_LABELS = {
  google: "Войти через Google",
  yandex: "Войти через Яндекс",
  vk: "Войти через VK",
  telegram: "Войти через Telegram",
  max: "Войти через MAX",
  phone: "Войти по номеру телефона",
};

const field =
  "h-10 w-full rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 text-sm text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--accent)]";
const primary =
  "h-10 w-full rounded-md bg-[var(--accent)] px-4 text-sm font-medium text-[var(--on-accent)] hover:bg-[var(--accent-hover)] active:bg-[var(--accent-press)] disabled:opacity-60";
const secondary =
  "h-10 w-full rounded-md border border-[var(--line)] px-4 text-sm font-medium text-[var(--ink)] hover:bg-[var(--surface-hover)] active:bg-[var(--accent-soft)] disabled:opacity-60";

/**
 * Кнопки способов входа — ровно те, что платформа предлагает людям прямо
 * сейчас: и OAuth-провайдеры, и мессенджеры, и вход по номеру. Набор считает
 * платформа (ключи контура + рубильники администратора + выбор владельца
 * приложения), страница его только рисует — иначе кнопка уводит в 403.
 */
function MethodButtons({ methods, onPick, disabled }) {
  const ids = [
    ...(methods.providers ?? []),
    ...(methods.telegram ? ["telegram"] : []),
    ...(methods.max ? ["max"] : []),
    ...(methods.phone ? ["phone"] : []),
  ];
  if (!ids.length) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
        <span className="h-px flex-1 bg-[var(--line)]" />
        или
        <span className="h-px flex-1 bg-[var(--line)]" />
      </div>
      {ids.map((id) => (
        <button
          key={id}
          type="button"
          className={secondary}
          disabled={disabled}
          onClick={() => onPick(id)}
        >
          {METHOD_LABELS[id] ?? `Войти через ${id}`}
        </button>
      ))}
    </div>
  );
}

/** Список доступных методов входа; пока не приехал — форма уже рисуется. */
function useAuthMethods() {
  const { authMethods } = useAuth();
  const [methods, setMethods] = useState({
    password: true,
    providers: [],
    telegram: false,
    max: false,
    phone: false,
  });
  useEffect(() => {
    let active = true;
    authMethods()
      .then((m) => active && setMethods(m))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [authMethods]);
  return methods;
}

/**
 * Форма входа.
 *
 * @param {object} props
 * @param {string} [props.returnUrl] куда вернуться после входа (по умолчанию — корень)
 * @param {string} [props.registerHref] адрес своей страницы регистрации
 * @param {boolean} [props.showForgot] показывать «Забыли пароль?» (по умолчанию да)
 * @param {Record<string,string>} [props.copy] свои тексты отказов
 * @param {() => void} [props.onSuccess] редкий случай: вход БЕЗ ухода со страницы
 */
export function LoginForm({
  returnUrl,
  registerHref = "/register",
  showForgot = true,
  copy,
  onSuccess,
}) {
  const { signIn, requestPasswordReset, startLogin } = useAuth();
  const methods = useAuthMethods();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const texts = { ...REASONS, ...(copy ?? {}) };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    const res = await signIn({
      email,
      password,
      ...(returnUrl ? { returnUrl } : {}),
    });
    // На успехе SDK уже уводит браузер на адрес возврата — снимать busy
    // некуда и незачем, иначе кнопка на мгновение оживает перед уходом.
    if (res.ok) {
      onSuccess?.();
      return;
    }
    setBusy(false);
    setError(texts[res.reason] ?? texts.unknown);
  };

  const forgot = async () => {
    if (!email) {
      setError("Укажите почту — на неё уйдёт ссылка.");
      return;
    }
    setError(null);
    setBusy(true);
    await requestPasswordReset({ email });
    setBusy(false);
    // Ответ всегда одинаковый: по нему нельзя узнать, есть такой адрес или нет.
    setNotice("Если такая почта у нас есть, письмо со ссылкой уже отправлено.");
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="auth-email">
          Почта
        </label>
        <input
          id="auth-email"
          type="email"
          autoComplete="email"
          required
          className={field}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="auth-password">
          Пароль
        </label>
        <input
          id="auth-password"
          type="password"
          autoComplete="current-password"
          required
          className={field}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="text-sm text-[var(--muted)]">{notice}</p>
      ) : null}

      <button type="submit" className={primary} disabled={busy}>
        {busy ? "Входим…" : "Войти"}
      </button>

      <MethodButtons
        methods={methods}
        disabled={busy}
        onPick={(m) => startLogin(m, returnUrl)}
      />

      <div className="flex items-center justify-between text-sm">
        {registerHref ? (
          <a
            className="text-[var(--muted)] hover:text-[var(--ink)]"
            href={registerHref}
          >
            Регистрация
          </a>
        ) : (
          <span />
        )}
        {showForgot ? (
          <button
            type="button"
            className="text-[var(--muted)] hover:text-[var(--ink)]"
            onClick={forgot}
            disabled={busy}
          >
            Забыли пароль?
          </button>
        ) : null}
      </div>
    </form>
  );
}

/**
 * Форма регистрации.
 *
 * Обычный успех — НЕ вход: почта подтверждается обязательно, поэтому вместо
 * ухода в приложение показывается «проверьте почту». Не переписывайте это на
 * редирект: сессии в этот момент ещё нет.
 */
export function RegisterForm({
  returnUrl,
  loginHref = "/login",
  copy,
  askName = true,
}) {
  const { signUp, startLogin } = useAuth();
  const methods = useAuthMethods();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);
  const texts = { ...REASONS, ...(copy ?? {}) };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await signUp({
      email,
      password,
      ...(askName ? { name } : {}),
      ...(returnUrl ? { returnUrl } : {}),
    });
    if (res.ok && res.verifySent) {
      setBusy(false);
      setSent(true);
      return;
    }
    if (res.ok) return; // контур без подтверждения почты: SDK уже уводит
    setBusy(false);
    setError(texts[res.reason] ?? texts.unknown);
  };

  if (sent) {
    return (
      <div className="space-y-3">
        <p className="text-sm">
          Мы отправили письмо на <span className="font-medium">{email}</span>.
          Откройте ссылку из письма — после этого можно войти.
        </p>
        <a
          className="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
          href={loginHref}
        >
          Перейти ко входу
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {askName ? (
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="auth-name">
            Имя
          </label>
          <input
            id="auth-name"
            type="text"
            autoComplete="name"
            className={field}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      ) : null}
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="auth-email-new">
          Почта
        </label>
        <input
          id="auth-email-new"
          type="email"
          autoComplete="email"
          required
          className={field}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="auth-password-new">
          Пароль
        </label>
        <input
          id="auth-password-new"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={field}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      <button type="submit" className={primary} disabled={busy}>
        {busy ? "Создаём…" : "Зарегистрироваться"}
      </button>

      <MethodButtons
        methods={methods}
        disabled={busy}
        onPick={(m) => startLogin(m, returnUrl)}
      />

      {loginHref ? (
        <a
          className="block text-sm text-[var(--muted)] hover:text-[var(--ink)]"
          href={loginHref}
        >
          Уже есть аккаунт — войти
        </a>
      ) : null}
    </form>
  );
}
