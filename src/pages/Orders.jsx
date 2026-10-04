import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { entities } from "@/lib/vibeli.js";
import { EmptyState, ErrorState, Loading, Modal } from "@/components/ui.jsx";
import { Button } from "@/components/ui/button.jsx";
import { OrderFormDialogBody } from "@/components/OrderForm.jsx";
import { StatusBadge } from "@/pages/Home.jsx";
import { downloadCsv } from "@/lib/csv.js";
import { fmtDateShort, money, parseItems } from "@/lib/fmt.js";
import { ORDER_STATUSES, statusLabel } from "@/lib/statuses.js";
import { Plus, Search, Download } from "lucide-react";

// Заказы: поиск по номеру, фильтры по статусу и клиенту, создание, экспорт.

const CSV_HEADERS = [
  { key: "number", label: "Номер" },
  { key: "client", label: "Клиент" },
  { key: "positions", label: "Позиции" },
  { key: "total", label: "Сумма" },
  { key: "status", label: "Статус" },
  { key: "comment", label: "Комментарий" },
];

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [clients, setClients] = useState([]);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [clientId, setClientId] = useState("all");
  const [formOpen, setFormOpen] = useState(false);

  function load() {
    setError(null);
    Promise.all([
      entities.Order.list({ sort: [{ field: "number", dir: "desc" }], limit: 500 }),
      entities.Client.list({ sort: [{ field: "name", dir: "asc" }], limit: 500 }),
    ])
      .then(([o, c]) => {
        setOrders(o.items);
        setClients(c.items);
      })
      .catch((e) => {
        console.error(e);
        setError("Не удалось загрузить список заказов.");
      });
  }

  useEffect(load, []);

  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  const filtered = useMemo(() => {
    if (!orders) return [];
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (clientId !== "all" && o.client_id !== clientId) return false;
      if (!q) return true;
      const client = clientById.get(o.client_id)?.name ?? "";
      return (String(o.number ?? "") + " " + client + " " + String(o.comment ?? ""))
        .toLowerCase()
        .includes(q);
    });
  }, [orders, query, status, clientId, clientById]);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--ink)]">Заказы</h1>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            {orders ? `${orders.length} всего, ${filtered.length} в выборке` : "Загрузка…"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!filtered.length}
            onClick={() =>
              downloadCsv(
                "zakazy.csv",
                CSV_HEADERS,
                filtered.map((o) => ({
                  number: o.number,
                  client: clientById.get(o.client_id)?.name ?? "",
                  positions: parseItems(o.items).length,
                  total: Number(o.total) ?? 0,
                  status: statusLabel(o.status),
                  comment: o.comment ?? "",
                })),
              )
            }
          >
            <Download size={16} className="text-[var(--muted)]" /> Экспорт CSV
          </Button>
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus size={16} /> Новый заказ
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по номеру, клиенту…"
            aria-label="Поиск заказов"
            className="h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] pl-9 pr-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Фильтр по статусу"
          className="h-9 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
        >
          <option value="all">Все статусы</option>
          {Object.entries(ORDER_STATUSES).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          aria-label="Фильтр по клиенту"
          className="h-9 max-w-[220px] rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
        >
          <option value="all">Все клиенты</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !orders ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={orders.length ? "Ничего не найдено" : "Заказов пока нет"}
          hint={orders.length ? "Измените поиск или фильтры." : "Создайте первый заказ."}
          action={
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus size={16} /> Новый заказ
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-md border border-[var(--line)] bg-[var(--surface)]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-[var(--line)] bg-[var(--neutral-soft)] text-xs text-[var(--muted)]">
              <tr>
                <th className="px-4 py-2.5 font-medium">Номер</th>
                <th className="px-4 py-2.5 font-medium">Клиент</th>
                <th className="px-4 py-2.5 text-right font-medium">Позиций</th>
                <th className="px-4 py-2.5 text-right font-medium">Сумма</th>
                <th className="px-4 py-2.5 font-medium">Статус</th>
                <th className="px-4 py-2.5 font-medium">Комментарий</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const items = parseItems(o.items);
                const client = clientById.get(o.client_id);
                return (
                  <tr key={o.id} className="border-b border-[var(--line)] last:border-b-0 hover:bg-[var(--bg)]">
                    <td className="px-4 py-2.5">
                      <Link to={"/orders/" + o.id} className="font-medium text-[var(--ink)] hover:text-[var(--accent)] hover:underline">
                        {o.number}
                      </Link>
                    </td>
                    <td className="max-w-[240px] truncate px-4 py-2.5 text-[var(--ink-soft)]">
                      {client?.name ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-[var(--ink-soft)]">{items.length}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{money(o.total)}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={o.status} /></td>
                    <td className="max-w-[260px] truncate px-4 py-2.5 text-xs text-[var(--muted)]">{o.comment || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={formOpen} onOpenChange={setFormOpen} title="Новый заказ" wide>
        <OrderFormDialogBody
          onSaved={() => {
            setFormOpen(false);
            load();
          }}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>
    </div>
  );
}
