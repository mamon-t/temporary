import { useEffect, useMemo, useState } from "react";
import { entities } from "@/lib/vibeli.js";
import { Button } from "@/components/ui/button.jsx";
import { Field, TextInput, TextArea, Select } from "@/components/ui.jsx";
import { money, num } from "@/lib/fmt.js";
import { Plus, Trash2 } from "lucide-react";

// Создание заказа: клиент, несколько позиций с автоматической суммой.
// Цена позиции берётся из каталога на момент добавления.

const EMPTY = {
  client_id: "",
  comment: "",
  status: "new",
};

function nextNumber(orders) {
  const nums = orders
    .map((o) => Number(String(o.number ?? "").replace(/\D/g, "")))
    .filter(Number.isFinite);
  const max = nums.length ? Math.max(...nums) : 1000;
  return "КЗ-" + (max + 1);
}

export function OrderFormDialogBody({ onSaved, onCancel }) {
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [rows, setRows] = useState([{ product_id: "", qty: 1 }]);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all([
      entities.Client.list({ sort: [{ field: "name", dir: "asc" }], limit: 500 }),
      entities.Product.list({ sort: [{ field: "name", dir: "asc" }], limit: 500 }),
      entities.Order.list({ sort: [{ field: "number", dir: "desc" }], limit: 1 }),
    ])
      .then(([c, p, o]) => {
        if (!alive) return;
        setClients(c.items);
        setProducts(p.items);
      })
      .catch((e) => {
        console.error(e);
        setError("Не удалось загрузить справочники.");
      });
    return () => {
      alive = false;
    };
  }, []);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  function setRow(i, patch) {
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

  const total = rows.reduce((sum, r) => {
    const p = byId.get(r.product_id);
    const qty = Number(r.qty);
    return sum + (p && Number.isFinite(qty) ? p.price * qty : 0);
  }, 0);

  async function submit(e) {
    e.preventDefault();
    if (!form.client_id) {
      setError("Выберите клиента.");
      return;
    }
    const items = rows
      .map((r) => {
        const p = byId.get(r.product_id);
        const qty = Number(r.qty);
        if (!p || !Number.isFinite(qty) || qty <= 0) return null;
        return { sku: p.sku ?? "", name: p.name, price: p.price, qty };
      })
      .filter(Boolean);
    if (!items.length) {
      setError("Добавьте хотя бы одну позицию с количеством.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const page = await entities.Order.list({ sort: [{ field: "number", dir: "desc" }], limit: 1 });
      const order = await entities.Order.create({
        number: nextNumber(page.items),
        client_id: form.client_id,
        items: JSON.stringify(items),
        total,
        status: form.status || "new",
        comment: form.comment,
      });
      // В историю клиента уходит запись о заявке — вспомогательная, не блокирует заказ.
      entities.ClientInteraction.create({
        client_id: form.client_id,
        date: new Date().toISOString(),
        kind: "order",
        description: "Создана заявка № " + order.number + " на сумму " + money(total) + ".",
      }).catch((err) => console.error(err));
      onSaved(order);
    } catch (err) {
      console.error(err);
      setError("Не удалось создать заказ. Попробуйте ещё раз.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="Клиент" required>
        <Select value={form.client_id} onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value }))}>
          <option value="">— выберите —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>

      <div>
        <p className="mb-2 text-xs font-medium text-[var(--muted)]">Позиции заказа</p>
        <div className="space-y-2">
          {rows.map((r, i) => {
            const p = byId.get(r.product_id);
            return (
              <div key={i} className="flex flex-wrap items-end gap-2">
                <div className="min-w-[240px] flex-1">
                  <Field label={i === 0 ? "Товар" : undefined}>
                    <Select
                      value={r.product_id}
                      onChange={(e) => setRow(i, { product_id: e.target.value })}
                      aria-label="Товар позиции"
                    >
                      <option value="">— выберите товар —</option>
                      {products.map((pr) => (
                        <option key={pr.id} value={pr.id}>
                          {pr.name} — {money(pr.price)}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Field label="Кол-во" className="w-24">
                  <TextInput
                    value={r.qty}
                    inputMode="numeric"
                    onChange={(e) => setRow(i, { qty: e.target.value })}
                    aria-label="Количество"
                  />
                </Field>
                <div className="w-28 pb-2 text-right text-sm tabular-nums text-[var(--ink)]">
                  {p ? money(p.price * (Number(r.qty) || 0)) : "—"}
                </div>
                <button
                  type="button"
                  className="mb-1.5 rounded-md p-2 text-[var(--muted)] hover:bg-[var(--neutral-soft)] hover:text-[var(--danger)]"
                  onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((_, j) => j !== i) : [{ product_id: "", qty: 1 }]))}
                  aria-label="Удалить позицию"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => setRows((rs) => [...rs, { product_id: "", qty: 1 }])}
        >
          <Plus size={16} className="text-[var(--muted)]" /> Добавить позицию
        </Button>
      </div>

      <div className="flex justify-end border-t border-[var(--line)] pt-3 text-sm">
        <span className="text-[var(--muted)]">Итого:&nbsp;</span>
        <span className="font-semibold tabular-nums text-[var(--ink)]">{money(total)}</span>
      </div>

      <Field label="Комментарий">
        <TextArea value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} />
      </Field>

      {error ? (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Отмена
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Создаём…" : "Создать заказ"}
        </Button>
      </div>
    </form>
  );
}
