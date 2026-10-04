import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { entities } from "@/lib/vibeli.js";
import { Badge, EmptyState, ErrorState, Loading } from "@/components/ui.jsx";
import { money, num, fmtDateShort } from "@/lib/fmt.js";
import { ORDER_STATUSES, STATUS_FLOW, statusLabel } from "@/lib/statuses.js";
import { Users, Package, ShoppingCart, AlertTriangle, ArrowRight } from "lucide-react";

// Дашборд: счётчики, сводка по статусам заказов, последние заказы,
// товары с нулевым остатком.

export function StatusBadge({ status }) {
  const st = ORDER_STATUSES[status];
  return <Badge color={st?.color} soft={st?.soft}>{statusLabel(status)}</Badge>;
}

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  function load() {
    setError(null);
    Promise.all([
      entities.Client.list({ limit: 500 }),
      entities.Product.list({ limit: 500 }),
      entities.Order.list({ sort: [{ field: "number", dir: "desc" }], limit: 500 }),
    ])
      .then(([c, p, o]) => setData({ clients: c.items, products: p.items, orders: o.items }))
      .catch((e) => {
        console.error(e);
        setError("Не удалось загрузить данные дашборда.");
      });
  }

  useEffect(load, []);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <Loading />;

  const { clients, products, orders } = data;
  const activeOrders = orders.filter((o) => o.status !== "closed" && o.status !== "cancelled");
  const revenue = orders
    .filter((o) => ["paid", "shipped", "closed"].includes(o.status))
    .reduce((s, o) => s + (Number(o.total) || 0), 0);
  const statuses = STATUS_FLOW.concat("cancelled");
  const statusCounts = Object.fromEntries(
    statuses.map((s) => [s, orders.filter((o) => o.status === s).length]),
  );
  const zeroStock = products.filter((p) => (Number(p.stock) || 0) === 0);
  const recent = orders.slice(0, 6);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-[var(--ink)]">Дашборд</h1>
        <p className="mt-0.5 text-sm text-[var(--muted)]">Сводка по торговой базе · демо-данные</p>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard to="/clients" icon={Users} label="Клиенты" value={num(clients.length)} />
        <StatCard to="/products" icon={Package} label="Товары" value={num(products.length)} />
        <StatCard to="/orders" icon={ShoppingCart} label="Активные заказы" value={num(activeOrders.length)} />
        <StatCard label="Оплачено и отгружено" value={money(revenue)} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-md border border-[var(--line)] bg-[var(--surface)] p-4 xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--ink)]">Последние заказы</h2>
            <Link
              to="/orders"
              className="inline-flex items-center gap-1 text-xs text-[var(--muted)] underline-offset-4 hover:text-[var(--ink)] hover:underline"
            >
              Все заказы <ArrowRight size={12} aria-hidden="true" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState title="Заказов пока нет" hint="Создайте первый заказ в разделе «Заказы»." />
          ) : (
            <div className="-mx-4 overflow-x-auto px-4">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="text-xs text-[var(--muted)]">
                    <th className="pb-2 pr-3 font-medium">Номер</th>
                    <th className="pb-2 pr-3 font-medium">Клиент</th>
                    <th className="pb-2 pr-3 text-right font-medium">Сумма</th>
                    <th className="pb-2 font-medium">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((o) => (
                    <tr key={o.id} className="border-t border-[var(--line)]">
                      <td className="py-2 pr-3">
                        <Link to={"/orders/" + o.id} className="text-[var(--ink)] hover:text-[var(--accent)] hover:underline">
                          {o.number}
                        </Link>
                      </td>
                      <td className="max-w-[220px] truncate py-2 pr-3 text-[var(--ink-soft)]">
                        {clientName(clients, o.client_id)}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">{money(o.total)}</td>
                      <td className="py-2">
                        <StatusBadge status={o.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-md border border-[var(--line)] bg-[var(--surface)] p-4">
            <h2 className="mb-3 text-sm font-semibold text-[var(--ink)]">Заказы по статусам</h2>
            <ul className="space-y-2">
              {statuses.map((s) => (
                <li key={s} className="flex items-center justify-between gap-3 text-sm">
                  <StatusBadge status={s} />
                  <span className="tabular-nums text-[var(--ink)]">{statusCounts[s] ?? 0}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-md border border-[var(--line)] bg-[var(--surface)] p-4">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-[var(--muted)]" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-[var(--ink)]">Нет в наличии</h2>
            </div>
            {zeroStock.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Все товары на складе.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {zeroStock.slice(0, 5).map((p) => (
                  <li key={p.id} className="flex items-baseline justify-between gap-3">
                    <Link to={"/products/" + p.id} className="min-w-0 truncate text-[var(--ink)] hover:text-[var(--accent)] hover:underline">
                      {p.name}
                    </Link>
                    <span className="shrink-0 text-xs text-[var(--muted)]">0 {p.unit ?? "шт"}</span>
                  </li>
                ))}
                {zeroStock.length > 5 ? (
                  <li className="pt-1 text-xs text-[var(--muted)]">и ещё {zeroStock.length - 5}…</li>
                ) : null}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function clientName(clients, id) {
  const c = clients.find((x) => x.id === id);
  return c?.name ?? "—";
}

function StatCard({ to, icon: Icon, label, value }) {
  const body = (
    <div className="flex items-center gap-3 rounded-md border border-[var(--line)] bg-[var(--surface)] p-4">
      {Icon ? <Icon size={20} className="shrink-0 text-[var(--muted)]" aria-hidden="true" /> : null}
      <div className="min-w-0">
        <p className="truncate text-xs text-[var(--muted)]">{label}</p>
        <p className="text-lg font-semibold tabular-nums text-[var(--ink)]">{value}</p>
      </div>
    </div>
  );
  return to ? (
    <Link to={to} className="group rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
      <div className="transition group-hover:border-[var(--muted)]">{body}</div>
    </Link>
  ) : (
    body
  );
}
