import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { entities } from "@/lib/vibeli.js";
import { Badge, EmptyState, ErrorState, Loading, Modal } from "@/components/ui.jsx";
import { Button } from "@/components/ui/button.jsx";
import { ProductFormDialogBody } from "@/components/ProductForm.jsx";
import { ImportDialog } from "@/components/ImportDialog.jsx";
import { downloadCsv } from "@/lib/csv.js";
import { fmtDateShort, money, num } from "@/lib/fmt.js";
import { Plus, Search, Download, Upload } from "lucide-react";

// Список товаров: поиск, фильтры по категории и поставщику, импорт/экспорт CSV.

const CSV_HEADERS = [
  { key: "name", label: "Название" },
  { key: "sku", label: "Артикул" },
  { key: "category", label: "Категория" },
  { key: "unit", label: "Ед." },
  { key: "price", label: "Цена" },
  { key: "stock", label: "Остаток" },
  { key: "manufacturer", label: "Производитель" },
  { key: "manufacturer_url", label: "Сайт производителя" },
  { key: "supplier", label: "Поставщик" },
  { key: "last_supply_date", label: "Посл. поступление" },
  { key: "description", label: "Описание" },
];

export default function Products() {
  const [products, setProducts] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [supplierId, setSupplierId] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  function load() {
    setError(null);
    Promise.all([
      entities.Product.list({ sort: [{ field: "name", dir: "asc" }], limit: 500 }),
      entities.Supplier.list({ limit: 200 }),
    ])
      .then(([p, s]) => {
        setProducts(p.items);
        setSuppliers(s.items);
      })
      .catch((e) => {
        console.error(e);
        setError("Не удалось загрузить список товаров.");
      });
  }

  useEffect(load, []);

  const supplierById = useMemo(() => new Map(suppliers.map((s) => [s.id, s])), [suppliers]);
  const categories = useMemo(
    () => [...new Set((products ?? []).map((p) => p.category).filter(Boolean))].sort(),
    [products],
  );

  const filtered = useMemo(() => {
    if (!products) return [];
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (supplierId !== "all" && p.supplier_id !== supplierId) return false;
      if (!q) return true;
      return [p.name, p.sku, p.manufacturer, p.description]
        .map((v) => String(v ?? "").toLowerCase())
        .some((v) => v.includes(q));
    });
  }, [products, query, category, supplierId]);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--ink)]">Товары</h1>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            {products ? `${products.length} всего, ${filtered.length} в выборке` : "Загрузка…"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload size={16} className="text-[var(--muted)]" /> Импорт
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!filtered.length}
            onClick={() =>
              downloadCsv(
                "tovary.csv",
                CSV_HEADERS,
                filtered.map((p) => ({
                  ...p,
                  last_supply_date: p.last_supply_date ? fmtDateShort(p.last_supply_date) : "",
                  supplier: p.supplier_id ? supplierById.get(p.supplier_id)?.name ?? "" : "",
                })),
              )
            }
          >
            <Download size={16} className="text-[var(--muted)]" /> Экспорт CSV
          </Button>
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus size={16} /> Новый товар
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по названию, артикулу…"
            aria-label="Поиск товаров"
            className="h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] pl-9 pr-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Фильтр по категории"
          className="h-9 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
        >
          <option value="all">Все категории</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          aria-label="Фильтр по поставщику"
          className="h-9 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
        >
          <option value="all">Все поставщики</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !products ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={products.length ? "Ничего не найдено" : "Товаров пока нет"}
          hint={products.length ? "Измените поиск или фильтры." : "Добавьте товар или импортируйте список."}
          action={
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus size={16} /> Новый товар
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-md border border-[var(--line)] bg-[var(--surface)]">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-[var(--line)] bg-[var(--neutral-soft)] text-xs text-[var(--muted)]">
              <tr>
                <th className="px-4 py-2.5 font-medium">Товар</th>
                <th className="px-4 py-2.5 font-medium">Артикул</th>
                <th className="px-4 py-2.5 text-right font-medium">Цена</th>
                <th className="px-4 py-2.5 text-right font-medium">Остаток</th>
                <th className="px-4 py-2.5 font-medium">Производитель</th>
                <th className="px-4 py-2.5 font-medium">Поставщик</th>
                <th className="px-4 py-2.5 font-medium">Посл. поступление</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const stock = Number(p.stock) || 0;
                const sup = p.supplier_id ? supplierById.get(p.supplier_id) : null;
                return (
                  <tr key={p.id} className="border-b border-[var(--line)] last:border-b-0 hover:bg-[var(--bg)]">
                    <td className="px-4 py-2.5">
                      <Link to={"/products/" + p.id} className="font-medium text-[var(--ink)] hover:text-[var(--accent)] hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-[var(--ink-soft)]">{p.sku || "—"}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{money(p.price)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {stock === 0 ? (
                        <Badge color="var(--danger)">нет</Badge>
                      ) : stock < 10 ? (
                        <span>{num(stock)} {p.unit ?? "шт"}</span>
                      ) : (
                        <span className="text-[var(--ink-soft)]">{num(stock)} {p.unit ?? "шт"}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--ink-soft)]">{p.manufacturer || "—"}</td>
                    <td className="px-4 py-2.5 text-[var(--ink-soft)]">{sup?.name ?? "—"}</td>
                    <td className="px-4 py-2.5 tabular-nums text-[var(--ink-soft)]">{fmtDateShort(p.last_supply_date)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={formOpen} onOpenChange={setFormOpen} title="Новый товар" wide>
        <ProductFormDialogBody
          initial={null}
          onSaved={() => {
            setFormOpen(false);
            load();
          }}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={load}
      />
    </div>
  );
}
