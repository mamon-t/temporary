import { Component } from "react";

// Catches render/runtime errors anywhere in the app tree so a single throwing
// component shows a recoverable notice instead of a blank white screen. The
// preview is a production build (no Vite dev error overlay), so without this an
// uncaught render error just unmounts everything to an empty #root — the app
// "disappears". Error boundaries have no hook equivalent, hence the class.
//
// Экран намеренно человеческий, а не отладочный (FEAT-85): владелец приложения
// не читает стек и не знает, что такое `e.split is not a function`. Заголовок —
// про приложение, текст ошибки лежит под раскрытием, а действий два: перезагрузить
// и — внутри превью платформы — «Починить в чате».
//
// Стили — ИНЛАЙНОМ, а не классами Tailwind (BUG-110). Экран показывается ровно
// тогда, когда с приложением уже что-то не так, и полагаться ему не на что:
// `src/index.css` принадлежит приложению, агент его переписывает, и стоит из
// него пропасть `@tailwind`-директивам — классы этого экрана не попадают в
// бандл вовсе. Живой случай: приложение «Редакция» на проде, CSS-бандл 387
// байт, ноль вхождений `min-h-screen` — человек увидел голый HTML с
// системными кнопками. Тот же расклад даёт битый или не догрузившийся CSS.

const CHILD = "vibeli-preview";
const PARENT = "vibeli-platform";

/** Встроены в iframe платформы (или любого другого родителя). */
const embedded = () => typeof window !== "undefined" && window.parent !== window;

/**
 * Палитра и размеры — свои, безотносительно темы приложения: экран ошибки
 * читается как системное сообщение поверх приложения, а не как его часть.
 */
const S = {
  screen: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 16px",
    background: "#f6f6f5",
    color: "#1c1e22",
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    lineHeight: 1.5,
    boxSizing: "border-box",
  },
  card: {
    width: "100%",
    maxWidth: "440px",
    background: "#ffffff",
    border: "1px solid #e4e3df",
    borderRadius: "12px",
    padding: "28px 24px",
    boxShadow: "0 4px 16px rgba(28, 30, 34, 0.06)",
    textAlign: "center",
    boxSizing: "border-box",
  },
  badge: {
    width: "48px",
    height: "48px",
    margin: "0 auto 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "999px",
    background: "#f1f0ee",
    fontSize: "24px",
    lineHeight: 1,
  },
  title: {
    margin: "0 0 6px",
    fontSize: "20px",
    fontWeight: 600,
    letterSpacing: "-0.01em",
    color: "#1c1e22",
  },
  text: { margin: 0, fontSize: "14px", color: "#6e737c" },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    justifyContent: "center",
    margin: "20px 0 0",
  },
  button: {
    height: "36px",
    padding: "0 16px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    border: "1px solid transparent",
    background: "#1c1e22",
    color: "#ffffff",
    font: "inherit",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
  },
  buttonSecondary: {
    height: "36px",
    padding: "0 16px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    border: "1px solid #d9d7d2",
    background: "#ffffff",
    color: "#1c1e22",
    font: "inherit",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
  },
  details: { marginTop: "20px", textAlign: "left" },
  summary: { cursor: "pointer", fontSize: "12px", color: "#6e737c" },
  pre: {
    margin: "8px 0 0",
    maxHeight: "160px",
    overflow: "auto",
    borderRadius: "8px",
    background: "#f1f0ee",
    padding: "12px",
    fontSize: "12px",
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
    color: "#4a4e56",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
};

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    // `platformOrigin` появляется только после рукопожатия с платформой — до
    // него кнопка «Починить в чате» не рисуется и постить некуда.
    this.state = { error: null, platformOrigin: null };
    this.onMessage = null;
    this.announceTimer = 0;
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Surface to the console so it shows up in the preview devtools / logs.
    // Отсюда же ошибка уезжает в рантайм-канал превью: сборщик логов слушает
    // console.error, и агент читает его getRuntimeLogsTool'ом.
    console.error("App crashed:", error, info?.componentStack);

    // Метка для автопроверки превью (FEAT-85): платформа грузит собранное
    // приложение headless-браузером и ДО отчёта «готово» смотрит, не показывает
    // ли оно этот экран. Ошибка, пойманная границей, не долетает до
    // window.onerror, поэтому без метки такой краш выглядит как обычная
    // отрисованная страница.
    try {
      window.__vibeliCrash = {
        message: String(error?.message || error || "unknown error"),
        stack: typeof error?.stack === "string" ? error.stack : undefined,
        componentStack: info?.componentStack,
        at: new Date().toISOString(),
      };
    } catch {
      // ничего страшного: метка — диагностика, а не работа приложения
    }

    if (!embedded()) return;
    // Рукопожатие своё, а не PreviewBridge'а: краш в первом же рендере сносит
    // всё дерево вместе с мостом, и его origin к этому моменту может быть ещё
    // не получен. Сами данные уходят ТОЛЬКО на origin, ответивший «hello», —
    // в "*" летит одно объявление без полезной нагрузки.
    this.onMessage = (event) => {
      if (event.source !== window.parent) return;
      const data = event.data;
      if (!data || data.source !== PARENT || data.type !== "hello") return;
      window.clearTimeout(this.announceTimer);
      this.setState({ platformOrigin: event.origin });
    };
    window.addEventListener("message", this.onMessage);

    let tries = 0;
    const announce = () => {
      if (this.state.platformOrigin) return;
      window.parent.postMessage({ source: CHILD, type: "ready" }, "*");
      if (++tries < 20) this.announceTimer = window.setTimeout(announce, 300);
    };
    announce();
  }

  componentWillUnmount() {
    if (this.onMessage) window.removeEventListener("message", this.onMessage);
    window.clearTimeout(this.announceTimer);
  }

  requestFix = () => {
    const { error, platformOrigin } = this.state;
    if (!platformOrigin) return;
    window.parent.postMessage(
      {
        source: CHILD,
        type: "fix-request",
        message: String(error?.message || error || "unknown error"),
        stack: typeof error?.stack === "string" ? error.stack.slice(0, 2000) : "",
        path: `${window.location.pathname}${window.location.search}`,
      },
      platformOrigin,
    );
  };

  render() {
    const { error, platformOrigin } = this.state;
    if (error) {
      const message = String(error?.message || "") || "неизвестная ошибка";
      return (
        <div
          // Та самая метка для автопроверки превью — по ней краш виден и без
          // доступа к window (page.$ в headless-браузере).
          data-vibeli-crash={message.slice(0, 200)}
          style={S.screen}
        >
          <div style={S.card}>
            <div style={S.badge}>⚠️</div>
            <h1 style={S.title}>Страница не открылась</h1>
            <p style={S.text}>
              Приложение споткнулось на этом экране. Остальные разделы обычно
              продолжают работать — попробуйте обновить страницу.
            </p>
            <div style={S.actions}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={S.button}
              >
                Обновить страницу
              </button>
              {platformOrigin ? (
                <button
                  type="button"
                  onClick={this.requestFix}
                  style={S.buttonSecondary}
                >
                  Починить в чате
                </button>
              ) : null}
            </div>
            <details style={S.details}>
              <summary style={S.summary}>Подробности ошибки</summary>
              <pre style={S.pre}>{message}</pre>
            </details>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
