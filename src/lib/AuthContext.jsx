// Thin auth context. The SDK core owns the heavy session lifecycle (code
// exchange, silent refresh, token rotation) — this context only reflects state,
// subscribes to onSessionExpired, and exposes login/logout redirects.
import { createContext, useContext, useEffect, useState } from "react";
import { vibeli } from "@/lib/vibeli.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Wait for the SDK bootstrap (code exchange + mode pre-check) to settle,
    // then load the current user if there is a session.
    vibeli
      .ready()
      .then(() => vibeli.auth.isAuthenticated())
      .then((authed) => (authed ? vibeli.auth.me() : null))
      .then((me) => {
        if (active) setUser(me);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    // The core decides *when* re-login is needed; the context just reacts.
    const off = vibeli.auth.onSessionExpired(() => {
      if (active) setUser(null);
    });

    return () => {
      active = false;
      off();
    };
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: user !== null,
    // `is_owner` приходит с /auth/me: гейтвей сверяет вошедшего с командой
    // приложения (IMPR-85). Флаг всегда есть в ответе, так что `=== true` тут
    // не «на всякий случай», а защита от старого гейтвея, который его не шлёт.
    isOwner: user?.is_owner === true,
    login: (returnUrl) => vibeli.auth.login(returnUrl),
    logout: (returnUrl) => vibeli.auth.logout(returnUrl),
    // Своя страница входа приложения (FEAT-68). Форму рисует приложение,
    // проверяет пару — платформа: методы ниже уходят на её ручки. Ни один из
    // них не бросает: «неверный пароль» приезжает как `{ ok: false, reason }`.
    // Пользоваться ими нужно ТОЛЬКО если у приложения есть свои /login и
    // /register; иначе вход — это `login()` выше (редирект на форму платформы).
    signIn: (input) => vibeli.auth.signIn(input),
    signUp: (input) => vibeli.auth.signUp(input),
    requestPasswordReset: (input) => vibeli.auth.requestPasswordReset(input),
    authMethods: () => vibeli.auth.authMethods(),
    // Любой способ из authMethods(): провайдер, мессенджер, телефон.
    startLogin: (method, returnUrl) => vibeli.auth.startLogin(method, returnUrl),
    startProviderLogin: (provider, returnUrl) =>
      vibeli.auth.startProviderLogin(provider, returnUrl),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
