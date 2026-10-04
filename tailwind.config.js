/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // ——— Дизайн-рамка проекта ———————————————————————————————————————
      // Этот файл НЕ входит в список путей, которые агент может писать
      // (lib/preview/project-fs.ts: только src/, public/, functions/,
      // entities/). Поэтому всё, что стоит здесь, — гарантия, а не пожелание:
      // ритм, шкала и роли гарнитур одинаковы во всех приложениях и не могут
      // быть переписаны на полпути. Меняется поверх этого только НАПОЛНЕНИЕ —
      // шесть цветов и две-три гарнитуры в src/index.css.
      //
      // Разделение взято из галереи: 31 из 54 рукодельных шаблонов пришли к
      // одному словарю токенов (bg / surface / ink / muted / line / accent),
      // а различаются значениями. Рамка жёсткая, наполнение свободное.
      fontFamily: {
        // Роли, а не названия: заголовки, текст, микролейблы. Конкретные
        // гарнитуры подставляются переменными из src/index.css.
        display: [
          "var(--font-display)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        meta: [
          "var(--font-meta)",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      fontSize: {
        // Пять ступеней с кратностью не меньше полутора — иначе иерархия
        // схлопывается на втором экране (герой 13vw, а заголовки секций
        // text-3xl). clamp, а не голые vw: на широком мониторе vw разносит
        // заголовок до нечитаемого, на узком — сминает.
        display: [
          "clamp(2.5rem, 7vw, 5.5rem)",
          { lineHeight: "0.95", letterSpacing: "-0.03em" },
        ],
        title: [
          "clamp(1.75rem, 3.6vw, 3rem)",
          { lineHeight: "1.08", letterSpacing: "-0.015em" },
        ],
        section: [
          "clamp(1.375rem, 2.2vw, 1.875rem)",
          { lineHeight: "1.2", letterSpacing: "-0.01em" },
        ],
        lead: ["clamp(1.0625rem, 1.3vw, 1.25rem)", { lineHeight: "1.55" }],
        // Микролейбл: капс с разрядкой над заголовком, подпись у метрики.
        meta: ["0.6875rem", { lineHeight: "1", letterSpacing: "0.2em" }],
      },
      spacing: {
        // Три уровня воздуха вместо одного mt-24 на весь документ. Ритм —
        // это контраст плотностей, а не равные интервалы.
        block: "max(2rem, 3.5vw)",
        section: "max(4rem, 7vw)",
        "section-lg": "max(6rem, 11vw)",
      },
      maxWidth: {
        content: "72rem",
        prose: "38rem",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // Цвета живут в src/index.css как var(--…) и в разметке берутся
      // арбитражной формой bg-[var(--accent)] — одна орфография на промт,
      // галерею и бойлерплейт. Ниже — только СОВМЕСТИМОСТЬ с привычкой
      // shadcn: модель по памяти пишет bg-primary и text-muted-foreground, и
      // до 1.14.0 эти имена смотрели в HSL-тройки второго словаря, которого
      // после переписывания :root не оставалось, — кнопка получала
      // hsl(undefined) и исчезала. Теперь старое имя — тот же токен.
      colors: {
        background: "var(--bg)",
        foreground: "var(--ink)",
        card: { DEFAULT: "var(--surface)", foreground: "var(--ink)" },
        popover: { DEFAULT: "var(--surface)", foreground: "var(--ink)" },
        primary: { DEFAULT: "var(--accent)", foreground: "var(--on-accent)" },
        secondary: { DEFAULT: "var(--surface)", foreground: "var(--ink)" },
        muted: { DEFAULT: "var(--surface)", foreground: "var(--muted)" },
        accent: { DEFAULT: "var(--accent-soft)", foreground: "var(--ink)" },
        destructive: { DEFAULT: "var(--danger)", foreground: "var(--on-danger)" },
        border: "var(--line)",
        input: "var(--line)",
        ring: "var(--accent)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
