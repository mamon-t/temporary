import { useEffect, useMemo, useState } from "react";
import { entities } from "@/lib/vibeli.js";
import { Badge, EmptyState, ErrorState, Loading, Modal } from "@/components/ui.jsx";
import { Button } from "@/components/ui/button.jsx";
import { SupplierFormDialogBody } from "@/components/SupplierForm.jsx";
import { Plus, Mail, Phone } from "lucide-react";

// Поставщики: упрощённый справочник. Количество товаров считается на клиенте.

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  function load() {
    setError(null);
    Promise.all([
      entities.Supplier.list({ sort: [{ field: "name", dir: "asc" }], limit: 200 }),
      entities.Product.list({ limit: 500 }),
    ])
      .then(([s, p]) => {
        setSuppliers(s.items);
        setProducts(p.items);
      })
      .catch((e) => {
        console.error(e);
        setError("Не удалось загрузить поставщиков.");
      });
  }

  useEffect(load, []);

  const countBySupplier = useMemo(() => {
    const m = new Map();
    for (const p of products) {
      if (p.supplier_id) m.set(p.supplier_id, (m.get(p.supplier_id) ?? 0) + 1);
    }
    return m;
  }, [products]);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--ink)]">Поставщики</h1>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            {suppliers ? `${suppliers.length} в справочнике` : "Загрузка…"}
          </p>
        </div>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus size={16} /> Новый поставщик
        </Button>
      </header>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !suppliers ? (
        <Loading />
      ) : suppliers.length === 0 ? (
        <EmptyState title="Поставщиков нет" hint="Добавьте первого поставщика." />
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {suppliers.map((s) => (
            <li key={s.id} className="rounded-md border border-[var(--line)] bg-[var(--surface)] p-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-sm font-semibold text-[var(--ink)]">{s.name}</h2>
                <Badge>{countBySupplier.get(s.id) ?? 0} тов.</Badge>
              </div>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">{s.contact_person || "—"}</p>
              <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
                {s.phone ? (
                  <a href={"tel:" + s.phone.replace(/[^\d+]/g, "")} className="inline-flex items-center gap-1.5 hover:text-[var(--ink)]">
                    <Phone size={13} aria-hidden="true" /> {s.phone}
                  </a>
                ) : null}
                {s.email ? (
                  <a href={"mailto:" + s.email} className="inline-flex items-center gap-1.5 hover:text-[var(--ink)]">
                    <Mail size={13} aria-hidden="true" /> {s.email}
                  </a>
                ) : null}
              </p>
              {s.comment ? <p className="mt-2 text-xs text-[var(--muted)]">{s.comment}</p> : null}
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 -ml-2 text-[var(--muted)]"
                onClick={() => setFormOpen(s)}
              >
                Редактировать
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={Boolean(formOpen)} onOpenChange={(v) => setFormOpen(v ? formOpen : false)} title={formOpen === true ? "Новый поставщик" : "Редактирование поставщика"}>
        <SupplierFormDialogBody
          initial={formOpen === true ? null : formOpen}
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
