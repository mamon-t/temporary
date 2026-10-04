import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { entities } from "@/lib/vibeli.js";
import { Badge, EmptyState, ErrorState, Loading, Modal } from "@/components/ui.jsx";
import { Button } from "@/components/ui/button.jsx";
import { ClientFormDialogBody } from "@/components/ClientForm.jsx";
import { downloadCsv } from "@/lib/csv.js";
import { fmtDateShort } from "@/lib/fmt.js";
import { CLIENT_KINDS } from "@/lib/statuses.js";
import { Plus, Search, Download } from "lucide-react";

// Список клиентов: поиск, фильтры по типу и статусу, экспорт CSV, создание.

const CSV_HEADERS = [
  { key: "kind", label: "Тип" },
  { key: "name", label: "Наименование / ФИО" },
  { key: "status", label: "Статус" },
  { key: "phone", label: "Телефон" },
  { key: "email", label: "E-mail" },
  { key: "address", label: "Адрес" },
  { key: "inn", label: "ИНН" },
  { key: "kpp", label: "КПП" },
  { key: "ogrn", label: "ОГРН" },
  { key: "legal_address", label: "Юр. адрес" },
  { key: "bank_name", label: "Банк" },
  { key: "bik", label: "БИК" },
  { key: "account", label: "Р/с" },
  { key: "corr_account", label: "К/с" },
  { key: "signer", label: "Подписант" },
  { key: "website", label: "Сайт" },
  { key: "comment", label: "Комментарий" },
];

export default function Clients() {
  const [clients, setClients] = useState(null);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("all");
  const [formOpen, setFormOpen] = useState(false);

  function load() {
    setError(null);
    entities.Client.list({ sort: [{ field: "name", dir: "asc" }], limit: 500 })
      .then((p) => setClients(p.items))
      .catch((e) => {
        console.error(e);
        setError("Не удалось загрузить список клиентов.");
      });
  }

  useEffect(load, []);

  const filtered = useMemo(() => {
    if (!clients) return [];
    const q = query.trim().toLowerCase();
    return clients.filter((c) => {
      if (kind !== "all" && c.kind !== kind) return false;
      if (status !== "all" && c.status !== status) return false;
      if (!q) return true;
      return [c.name, c.phone, c.email, c.inn, c.address, c.comment]
        .map((v) => String(v ?? "").toLowerCase())
        .some((v) => v.includes(q));
    });
  }, [clients, query, kind, status]);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--ink)]">Клиенты</h1>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            {clients ? `${clients.length} всего, ${filtered.length} в выборке` : "Загрузка…"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!filtered.length}
            onClick={() =>
              downloadCsv(
                "klienty.csv",
                CSV_HEADERS,
                filtered.map((c) => ({ ...c, kind: CLIENT_KINDS[c.kind]?.label ?? c.kind })),
              )
            }
          >
            <Download size={16} className="text-[var(--muted)]" /> Экспорт CSV
          </Button>
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus size={16} /> Новый клиент
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по имени, телефону, ИНН…"
            aria-label="Поиск клиентов"
            className="h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] pl-9 pr-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
          />
        </div>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          aria-label="Фильтр по типу клиента"
          className="h-9 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
        >
          <option value="all">Все типы</option>
          <option value="company">Юрлица</option>
          <option value="person">Частные лица</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Фильтр по статусу"
          className="h-9 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
        >
          <option value="all">Все статусы</option>
          <option value="active">Активные</option>
          <option value="archived">В архиве</option>
        </select>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !clients ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={clients.length ? "Ничего не найдено" : "Клиентов пока нет"}
          hint={clients.length ? "Измените поиск или фильтры." : "Добавьте первого клиента."}
          action={
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus size={16} /> Новый клиент
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-md border border-[var(--line)] bg-[var(--surface)]">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-[var(--line)] bg-[var(--neutral-soft)] text-xs text-[var(--muted)]">
              <tr>
                <th className="px-4 py-2.5 font-medium">Наименование / ФИО</th>
                <th className="px-4 py-2.5 font-medium">Тип</th>
                <th className="px-4 py-2.5 font-medium">Телефон</th>
                <th className="px-4 py-2.5 font-medium">E-mail</th>
                <th className="px-4 py-2.5 font-medium">ИНН</th>
                <th className="px-4 py-2.5 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-[var(--line)] last:border-b-0 hover:bg-[var(--bg)]">
                  <td className="px-4 py-2.5">
                    <Link to={"/clients/" + c.id} className="font-medium text-[var(--ink)] hover:text-[var(--accent)] hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-[var(--muted)]">{CLIENT_KINDS[c.kind]?.label ?? c.kind}</td>
                  <td className="px-4 py-2.5 text-[var(--ink-soft)]">{c.phone || "—"}</td>
                  <td className="px-4 py-2.5 text-[var(--ink-soft)]">{c.email || "—"}</td>
                  <td className="px-4 py-2.5 tabular-nums text-[var(--ink-soft)]">{c.inn || "—"}</td>
                  <td className="px-4 py-2.5">
                    {c.status === "archived" ? (
                      <Badge>В архиве</Badge>
                    ) : (
                      <Badge color="var(--ok)" soft="var(--ok-soft)">Активен</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={formOpen} onOpenChange={setFormOpen} title="Новый клиент" wide>
        <ClientFormDialogBody
          initial={null}
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
