import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { entities, VibeliError } from "@/lib/vibeli.js";
import { EmptyState, ErrorState, Loading } from "@/components/ui.jsx";
import { Button } from "@/components/ui/button.jsx";
import { StatusBadge } from "@/pages/Home.jsx";
import { fmtDateShort, money, parseItems } from "@/lib/fmt.js";
import { ORDER_STATUSES, STATUS_FLOW } from "@/lib/statuses.js";
import { ArrowLeft, ArrowRight, XCircle } from "lucide-react";

// Карточка заказа: клиент, позиции с суммой, смена статуса по цепочке.

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [client, setClient] = useState(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  function load() {
    setError(null);
    setMissing(false);
    entities.Order.get(id)
      .then((rec) => {
        setOrder(rec);
        return entities.Client.get(rec.client_id);
      })
      .then(setClient)
      .catch((e) => {
        console.error(e);
        if (e instanceof VibeliError && e.code === "not_found") setMissing(true);
        else setError("Не удалось загрузить заказ.");
      });
  }

  useEffect(load, [id]);

  if (missing) {
    return (
      <div className="space-y-4">
        <BackLink />
        <EmptyState title="Заказ не найден" hint="Возможно, запись удалена." />
      </div>
    );
  }
  if (error) return <div className="space-y-4"><BackLink /><ErrorState message={error} onRetry={load} /></div>;
  if (!order) return <Loading />;

  const items = parseItems(order.items);
  const flowIdx = STATUS_FLOW.indexOf(order.status);
  const nextStatus = flowIdx >= 0 && flowIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[flowIdx + 1] : null;
  const canAct = order.status !== "closed" && order.status !== "cancelled";

  async function setStatus(status) {
    setBusy(true);
    setError(null);
    try {
      const updated = await entities.Order.update(order.id, { status });
      setOrder(updated);
    } catch (e) {
      console.error(e);
      setError("Не удалось изменить статус. Попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <BackLink />

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--ink)]">Заказ {order.number}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Создан {fmtDateShort(order.created_date)} ·{" "}
            {client ? (
              <Link to={"/clients/" + client.id} className="text-[var(--ink)] underline-offset-4 hover:text-[var(--accent)] hover:underline">
                {client.name}
              </Link>
            ) : "—"}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </header>

      {canAct ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--surface)] p-3">
          <span className="text-xs text-[var(--muted)]">Действия:</span>
          {nextStatus ? (
            <Button size="sm" disabled={busy} onClick={() => setStatus(nextStatus)}>
              Перевести в «{ORDER_STATUSES[nextStatus].label}» <ArrowRight size={14} />
            </Button>
          ) : (
            <Button size="sm" disabled={busy} onClick={() => setStatus("closed")}>
              Закрыть заказ
            </Button>
          )}
          {order.status !== "new" ? null : (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => setStatus("confirmed")}>
              Подтвердить
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            className="text-[var(--danger)]"
            onClick={() => setStatus("cancelled")}
          >
            <XCircle size={14} className="text-[var(--muted)]" /> Отменить
          </Button>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-md border border-[var(--line)] bg-[var(--surface)]">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-[var(--line)] bg-[var(--neutral-soft)] text-xs text-[var(--muted)]">
            <tr>
              <th className="px-4 py-2.5 font-medium">Товар</th>
              <th className="px-4 py-2.5 font-medium">Артикул</th>
              <th className="px-4 py-2.5 text-right font-medium">Цена</th>
              <th className="px-4 py-2.5 text-right font-medium">Кол-во</th>
              <th className="px-4 py-2.5 text-right font-medium">Сумма</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-[var(--muted)]">
                  Позиции не указаны
                </td>
              </tr>
            ) : (
              items.map((it, i) => (
                <tr key={i} className="border-b border-[var(--line)] last:border-b-0">
                  <td className="px-4 py-2.5 text-[var(--ink)]">{it.name ?? "—"}</td>
                  <td className="px-4 py-2.5 tabular-nums text-[var(--ink-soft)]">{it.sku || "—"}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{money(it.price)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{Number(it.qty) || 0}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-medium">
                    {money((Number(it.price) || 0) * (Number(it.qty) || 0))}
                  </td>
                </tr>
              ))
            )}
            <tr className="bg-[var(--bg)]">
              <td colSpan={4} className="px-4 py-2.5 text-right text-sm text-[var(--muted)]">
                Итого:
              </td>
              <td className="px-4 py-2.5 text-right text-base font-semibold tabular-nums text-[var(--ink)]">
                {money(order.total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {order.comment ? (
        <div className="rounded-md border border-[var(--line)] bg-[var(--surface)] p-4">
          <h2 className="mb-1 text-sm font-semibold text-[var(--ink)]">Комментарий</h2>
          <p className="text-sm text-[var(--ink-soft)] whitespace-pre-wrap">{order.comment}</p>
        </div>
      ) : null}

      {error ? <p className="text-sm text-[var(--danger)]" role="alert">{error}</p> : null}
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/orders" className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--ink)]">
      <ArrowLeft size={16} aria-hidden="true" /> К списку заказов
    </Link>
  );
}
