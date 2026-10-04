// Форматирование для русского интерфейса. Суммы и даты — в одном месте,
// чтобы таблицы, карточки и дашборд показывали одинаково.

export function money(n) {
  const v = Number(n);
  return Number.isFinite(v)
    ? v.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₽"
    : "—";
}

export function num(n) {
  const v = Number(n);
  return Number.isFinite(v) ? v.toLocaleString("ru-RU") : "—";
}

// Дата без времени: «3 октября 2026 г.» — для карточек.
export function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

// Дата коротко для таблиц: 03.10.2026
export function fmtDateShort(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("ru-RU");
}

// Дата и время для истории взаимодействий: 03.10.2026, 14:30
export function fmtDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("ru-RU") + ", " + d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

// Позиции заказа хранятся JSON-строкой. Никогда не бросаем: битый JSON — пустой список.
export function parseItems(items) {
  if (!items) return [];
  if (Array.isArray(items)) return items;
  try {
    const parsed = JSON.parse(items);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clientShortName(c) {
  if (!c) return "—";
  return c.name ?? "—";
}
