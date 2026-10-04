import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { entities, VibeliError } from "@/lib/vibeli.js";
import { Badge, EmptyState, ErrorState, Field, Loading, Modal, Select, TextArea, TextInput } from "@/components/ui.jsx";
import { Button } from "@/components/ui/button.jsx";
import { ClientFormDialogBody } from "@/components/ClientForm.jsx";
import { StatusBadge } from "@/pages/Home.jsx";
import { fmtDate, fmtDateShort, money } from "@/lib/fmt.js";
import { CLIENT_KINDS, INTERACTION_KINDS } from "@/lib/statuses.js";
import { ArrowLeft, Pencil, Plus, Mail, Phone, MapPin, Globe } from "lucide-react";

// Карточка клиента: реквизиты, контакты, история взаимодействий, заказы.

const TABS = [
  { id: "details", label: "Реквизиты" },
  { id: "contacts", label: "Контакты" },
  { id: "history", label: "История взаимодействий" },
  { id: "orders", label: "Заказы" },
];

export default function ClientDetail() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("details");
  const [editOpen, setEditOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [interactionOpen, setInteractionOpen] = useState(false);

  const [contacts, setContacts] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [relatedError, setRelatedError] = useState(null);

  function load() {
    setError(null);
    setMissing(false);
    entities.Client.get(id)
      .then((rec) => {
        setClient(rec);
        return Promise.all([
          entities.ClientContact.filter({ client_id: id }, { limit: 100 }),
          entities.ClientInteraction.filter({ client_id: id }, { sort: [{ field: "date", dir: "desc" }], limit: 200 }),
          entities.Order.filter({ client_id: id }, { sort: [{ field: "number", dir: "desc" }], limit: 200 }),
        ]);
      })
      .then(([c, i, o]) => {
        setContacts(c.items);
        setInteractions(i.items);
        setOrders(o.items);
      })
      .catch((e) => {
        console.error(e);
        if (e instanceof VibeliError && e.code === "not_found") setMissing(true);
        else setError("Не удалось загрузить карточку клиента.");
      });
  }

  useEffect(load, [id]);

  if (missing) {
    return (
      <div className="space-y-4">
        <BackLink />
        <EmptyState title="Клиент не найден" hint="Возможно, запись удалена." action={<BackLink button />} />
      </div>
    );
  }
  if (error) return <div className="space-y-4"><BackLink /><ErrorState message={error} onRetry={load} /></div>;
  if (!client) return <Loading />;

  const isCompany = client.kind === "company";

  return (
    <div className="space-y-4">
      <BackLink />

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-[var(--ink)]">{client.name}</h1>
            <Badge>{CLIENT_KINDS[client.kind]?.label ?? client.kind}</Badge>
            {client.status === "archived" ? <Badge>В архиве</Badge> : null}
          </div>
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
            {client.phone ? (
              <span className="inline-flex items-center gap-1.5">
                <Phone size={14} className="text-[var(--muted)]" aria-hidden="true" />
                <a href={"tel:" + client.phone.replace(/[^\d+]/g, "")} className="hover:text-[var(--ink)]">{client.phone}</a>
              </span>
            ) : null}
            {client.email ? (
              <span className="inline-flex items-center gap-1.5">
                <Mail size={14} className="text-[var(--muted)]" aria-hidden="true" />
                <a href={"mailto:" + client.email} className="hover:text-[var(--ink)]">{client.email}</a>
              </span>
            ) : null}
            {client.website ? (
              <span className="inline-flex items-center gap-1.5">
                <Globe size={14} className="text-[var(--muted)]" aria-hidden="true" />
                <a href={client.website.startsWith("http") ? client.website : "https://" + client.website} target="_blank" rel="noreferrer" className="hover:text-[var(--ink)]">
                  {client.website}
                </a>
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setInteractionOpen(true)}>
            <Plus size={16} className="text-[var(--muted)]" /> Событие
          </Button>
          <Button size="sm" onClick={() => setEditOpen(true)}>
            <Pencil size={16} /> Редактировать
          </Button>
        </div>
      </header>

      <nav className="flex gap-1 border-b border-[var(--line)]" aria-label="Вкладки карточки клиента">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id}
            className={
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium " +
              (tab === t.id
                ? "border-[var(--accent)] text-[var(--ink)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]")
            }
          >
            {t.label}
          </button>
        ))}
      </nav>

      {relatedError ? <ErrorState message={relatedError} onRetry={load} /> : null}

      {tab === "details" ? <Details client={client} isCompany={isCompany} /> : null}
      {tab === "contacts" ? <Contacts contacts={contacts} /> : null}
      {tab === "history" ? <History interactions={interactions} /> : null}
      {tab === "orders" ? <Orders orders={orders} /> : null}

      <Modal open={editOpen} onOpenChange={setEditOpen} title="Редактирование клиента" wide>
        <ClientFormDialogBody
          initial={client}
          onSaved={(rec) => {
            setEditOpen(false);
            setClient(rec);
          }}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>

      <Modal open={contactOpen} onOpenChange={setContactOpen} title="Добавить контакт">
        <ContactForm
          clientId={id}
          onSaved={() => {
            setContactOpen(false);
            load();
          }}
          onCancel={() => setContactOpen(false)}
        />
      </Modal>

      <Modal open={interactionOpen} onOpenChange={setInteractionOpen} title="Новое событие в истории">
        <InteractionForm
          clientId={id}
          onSaved={() => {
            setInteractionOpen(false);
            load();
          }}
          onCancel={() => setInteractionOpen(false)}
        />
      </Modal>
    </div>
  );
}

function BackLink({ button }) {
  return (
    <Link
      to="/clients"
      className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--ink)]"
    >
      <ArrowLeft size={16} aria-hidden="true" /> К списку клиентов
    </Link>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-1 gap-0.5 border-b border-[var(--line)] py-2 last:border-b-0 sm:grid-cols-[220px_1fr] sm:gap-4">
      <span className="text-xs text-[var(--muted)]">{label}</span>
      <span className="text-sm text-[var(--ink)] whitespace-pre-wrap break-words">{value}</span>
    </div>
  );
}

function Details({ client, isCompany }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <section className="rounded-md border border-[var(--line)] bg-[var(--surface)] p-4">
        <h2 className="mb-2 text-sm font-semibold text-[var(--ink)]">Основное</h2>
        <Row label="Наименование / ФИО" value={client.name} />
        <Row label="Телефон" value={client.phone} />
        <Row label="E-mail" value={client.email} />
        <Row label="Адрес" value={client.address} />
        <Row label="Сайт" value={client.website} />
        <Row label="Комментарий" value={client.comment} />
      </section>
      {isCompany ? (
        <section className="rounded-md border border-[var(--line)] bg-[var(--surface)] p-4">
          <h2 className="mb-2 text-sm font-semibold text-[var(--ink)]">Реквизиты юрлица</h2>
          <Row label="ИНН" value={client.inn} />
          <Row label="КПП" value={client.kpp} />
          <Row label="ОГРН" value={client.ogrn} />
          <Row label="Юридический адрес" value={client.legal_address} />
          <Row label="Банк" value={client.bank_name} />
          <Row label="БИК" value={client.bik} />
          <Row label="Расчётный счёт" value={client.account} />
          <Row label="Корр. счёт" value={client.corr_account} />
          <Row label="Подписант" value={client.signer} />
        </section>
      ) : null}
    </div>
  );
}

function Contacts({ contacts }) {
  return (
    <div className="rounded-md border border-[var(--line)] bg-[var(--surface)]">
      {contacts.length === 0 ? (
        <div className="p-4">
          <EmptyState title="Контактов нет" hint="Добавьте контактное лицо, телефон или e-mail." />
        </div>
      ) : (
        <ul>
          {contacts.map((c) => (
            <li key={c.id} className="border-b border-[var(--line)] px-4 py-3 last:border-b-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-[var(--ink)]">{c.name}</span>
                {c.role ? <Badge>{c.role}</Badge> : null}
                {c.is_primary ? <Badge color="var(--ok)" soft="var(--ok-soft)">Основной</Badge> : null}
              </div>
              <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
                {c.phone ? (
                  <a href={"tel:" + c.phone.replace(/[^\d+]/g, "")} className="inline-flex items-center gap-1.5 hover:text-[var(--ink)]">
                    <Phone size={13} aria-hidden="true" /> {c.phone}
                  </a>
                ) : null}
                {c.email ? (
                  <a href={"mailto:" + c.email} className="inline-flex items-center gap-1.5 hover:text-[var(--ink)]">
                    <Mail size={13} aria-hidden="true" /> {c.email}
                  </a>
                ) : null}
                {c.address ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={13} aria-hidden="true" /> {c.address}
                  </span>
                ) : null}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function History({ interactions }) {
  if (!interactions.length) {
    return (
      <EmptyState title="История пуста" hint="Добавьте звонок, письмо, встречу или заметку кнопкой «Событие»." />
    );
  }
  return (
    <ol className="space-y-0">
      {interactions.map((it, idx) => (
        <li key={it.id} className="flex gap-4">
          <div className="w-36 shrink-0 pt-3 text-xs tabular-nums text-[var(--muted)]">
            {fmtDateTimeShort(it.date)}
          </div>
          <div className={"relative w-px shrink-0 bg-[var(--line)] " + (idx === interactions.length - 1 ? "" : "")}>
            <span className="absolute left-1/2 top-3.5 h-2 w-2 -translate-x-1/2 rounded-full bg-[var(--muted)]" />
          </div>
          <div className="min-w-0 flex-1 py-3">
            <Badge>{INTERACTION_KINDS[it.kind]?.label ?? it.kind}</Badge>
            <p className="mt-1 text-sm text-[var(--ink)] whitespace-pre-wrap">{it.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function fmtDateTimeShort(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("ru-RU") + " " + d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function Orders({ orders }) {
  if (!orders.length) {
    return <EmptyState title="Заказов нет" hint="Создайте заказ в разделе «Заказы», выбрав этого клиента." />;
  }
  const sum = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + (Number(o.total) || 0), 0);
  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--muted)]">
        Заказов: {orders.length} · на сумму без отмен: <span className="tabular-nums text-[var(--ink)]">{money(sum)}</span>
      </p>
      <div className="overflow-x-auto rounded-md border border-[var(--line)] bg-[var(--surface)]">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="border-b border-[var(--line)] bg-[var(--neutral-soft)] text-xs text-[var(--muted)]">
            <tr>
              <th className="px-4 py-2.5 font-medium">Номер</th>
              <th className="px-4 py-2.5 font-medium">Дата</th>
              <th className="px-4 py-2.5 text-right font-medium">Сумма</th>
              <th className="px-4 py-2.5 font-medium">Статус</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-[var(--line)] last:border-b-0 hover:bg-[var(--bg)]">
                <td className="px-4 py-2.5">
                  <Link to={"/orders/" + o.id} className="text-[var(--ink)] hover:text-[var(--accent)] hover:underline">
                    {o.number}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-[var(--ink-soft)]">{fmtDateShort(o.created_date)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{money(o.total)}</td>
                <td className="px-4 py-2.5"><StatusBadge status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ContactForm({ clientId, onSaved, onCancel }) {
  const [form, setForm] = useState({ name: "", role: "", phone: "", email: "", address: "", is_primary: false });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Укажите имя контакта.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await entities.ClientContact.create({ ...form, client_id: clientId });
      onSaved();
    } catch (err) {
      console.error(err);
      setError("Не удалось сохранить контакт.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Имя" required>
        <TextInput value={form.name} onChange={set("name")} required />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Роль / должность">
          <TextInput value={form.role} onChange={set("role")} />
        </Field>
        <Field label="Телефон">
          <TextInput type="tel" value={form.phone} onChange={set("phone")} />
        </Field>
        <Field label="E-mail">
          <TextInput type="email" value={form.email} onChange={set("email")} />
        </Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-[var(--ink)]">
          <input
            type="checkbox"
            checked={form.is_primary}
            onChange={(e) => setForm((f) => ({ ...f, is_primary: e.target.checked }))}
            className="h-4 w-4 rounded border-[var(--line)] accent-[var(--accent)]"
          />
          Основной контакт
        </label>
      </div>
      <Field label="Адрес">
        <TextArea value={form.address} onChange={set("address")} />
      </Field>
      {error ? <p className="text-sm text-[var(--danger)]" role="alert">{error}</p> : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Отмена</Button>
        <Button type="submit" disabled={saving}>{saving ? "Сохраняем…" : "Добавить"}</Button>
      </div>
    </form>
  );
}

function InteractionForm({ clientId, onSaved, onCancel }) {
  const [form, setForm] = useState({ kind: "call", date: "", description: "" });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (!form.description.trim()) {
      setError("Опишите событие.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await entities.ClientInteraction.create({
        client_id: clientId,
        kind: form.kind,
        date: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
        description: form.description.trim(),
      });
      onSaved();
    } catch (err) {
      console.error(err);
      setError("Не удалось сохранить событие.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Тип" required>
          <Select value={form.kind} onChange={set("kind")}>
            {Object.entries(INTERACTION_KINDS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Дата и время">
          <TextInput type="datetime-local" value={form.date} onChange={set("date")} />
        </Field>
      </div>
      <Field label="Описание" required>
        <TextArea value={form.description} onChange={set("description")} required />
      </Field>
      {error ? <p className="text-sm text-[var(--danger)]" role="alert">{error}</p> : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Отмена</Button>
        <Button type="submit" disabled={saving}>{saving ? "Сохраняем…" : "Добавить"}</Button>
      </div>
    </form>
  );
}
