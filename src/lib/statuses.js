// Статусы заказов и типы клиентов: подписи, цвета и порядок смены статуса.
// Цвета — токены из src/index.css; кроме цвета статус всегда подписан текстом.

export const ORDER_STATUSES = {
  new: { label: "Новый", color: "var(--info)", soft: "var(--info-soft)" },
  confirmed: { label: "Подтверждён", color: "var(--accent)", soft: "var(--neutral-soft)" },
  paid: { label: "Оплачен", color: "var(--ok)", soft: "var(--ok-soft)" },
  packed: { label: "Собран", color: "var(--warn)", soft: "var(--warn-soft)" },
  shipped: { label: "Отгружен", color: "var(--warn)", soft: "var(--warn-soft)" },
  closed: { label: "Закрыт", color: "var(--muted)", soft: "var(--neutral-soft)" },
  cancelled: { label: "Отменён", color: "var(--danger)", soft: "var(--neutral-soft)" },
};

// Рабочая цепочка; «Отменён» доступен отдельно.
export const STATUS_FLOW = ["new", "confirmed", "paid", "packed", "shipped", "closed"];

export function statusLabel(s) {
  return ORDER_STATUSES[s]?.label ?? String(s ?? "—");
}

export const CLIENT_KINDS = {
  person: { label: "Частное лицо" },
  company: { label: "Юридическое лицо" },
};

export const INTERACTION_KINDS = {
  call: { label: "Звонок" },
  email: { label: "Письмо" },
  meeting: { label: "Встреча" },
  note: { label: "Заметка" },
  order: { label: "Заявка" },
};
