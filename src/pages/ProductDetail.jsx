import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { entities, VibeliError } from "@/lib/vibeli.js";
import { Badge, EmptyState, ErrorState, Loading, Modal } from "@/components/ui.jsx";
import { Button } from "@/components/ui/button.jsx";
import { ProductFormDialogBody } from "@/components/ProductForm.jsx";
import { fmtDate, money, num } from "@/lib/fmt.js";
import { ArrowLeft, Pencil, Globe, PackageX } from "lucide-react";

// Карточка товара: фото (если есть), производитель со ссылкой, поставщик,
// дата последнего поступления, цена и остаток; редактирование.

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  function load() {
    setError(null);
    setMissing(false);
    entities.Product.get(id)
      .then((rec) => {
        setProduct(rec);
        if (rec.supplier_id) {
          entities.Supplier.get(rec.supplier_id)
            .then(setSupplier)
            .catch((e) => console.error(e));
        } else {
          setSupplier(null);
        }
      })
      .catch((e) => {
        console.error(e);
        if (e instanceof VibeliError && e.code === "not_found") setMissing(true);
        else setError("Не удалось загрузить карточку товара.");
      });
  }

  useEffect(load, [id]);

  if (missing) {
    return (
      <div className="space-y-4">
        <BackLink />
        <EmptyState title="Товар не найден" hint="Возможно, запись удалена." />
      </div>
    );
  }
  if (error) return <div className="space-y-4"><BackLink /><ErrorState message={error} onRetry={load} /></div>;
  if (!product) return <Loading />;

  const stock = Number(product.stock) || 0;

  return (
    <div className="space-y-4">
      <BackLink />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        {/* Фото: не обязательно. Без него — плейсхолдер с иконкой. */}
        <div className="flex items-center justify-center rounded-md border border-[var(--line)] bg-[var(--surface)] p-4">
          {product.photo_url ? (
            <img
              src={product.photo_url}
              alt={product.name}
              className="max-h-64 w-full rounded-sm object-contain"
            />
          ) : (
            <div className="flex h-40 w-full flex-col items-center justify-center gap-2 text-[var(--ink-faint)]">
              <PackageX size={32} aria-hidden="true" />
              <span className="text-xs">Фото не добавлено</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-[var(--ink)]">{product.name}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
                {product.sku ? <span className="tabular-nums">Артикул {product.sku}</span> : null}
                {product.category ? <Badge>{product.category}</Badge> : null}
              </p>
            </div>
            <Button size="sm" onClick={() => setEditOpen(true)}>
              <Pencil size={16} /> Редактировать
            </Button>
          </header>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Цена" value={money(product.price)} />
            <Metric
              label="Остаток"
              value={stock === 0 ? "Нет" : `${num(stock)} ${product.unit ?? "шт"}`}
              danger={stock === 0}
            />
            <Metric label="Посл. поступление" value={fmtDate(product.last_supply_date)} />
            <Metric label="Поставщик" value={supplier ? (
              <span className="text-sm text-[var(--ink)]">{supplier.name}</span>
            ) : "—"} />
          </div>

          {product.manufacturer ? (
            <div className="rounded-md border border-[var(--line)] bg-[var(--surface)] p-4 text-sm">
              <span className="text-xs text-[var(--muted)]">Производитель:&nbsp;</span>
              <span className="text-[var(--ink)]">{product.manufacturer}</span>
              {product.manufacturer_url ? (
                <>
                  {" · "}
                  <a
                    href={product.manufacturer_url.startsWith("http") ? product.manufacturer_url : "https://" + product.manufacturer_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[var(--ink)] underline underline-offset-4 hover:text-[var(--accent)]"
                  >
                    <Globe size={14} className="text-[var(--muted)]" aria-hidden="true" />
                    {product.manufacturer_url.replace(/^https?:\/\//, "")}
                  </a>
                </>
              ) : null}
            </div>
          ) : null}

          {product.description ? (
            <div className="rounded-md border border-[var(--line)] bg-[var(--surface)] p-4">
              <h2 className="mb-1 text-sm font-semibold text-[var(--ink)]">Описание</h2>
              <p className="text-sm text-[var(--ink-soft)] whitespace-pre-wrap">{product.description}</p>
            </div>
          ) : null}

          {supplier ? (
            <div className="rounded-md border border-[var(--line)] bg-[var(--surface)] p-4 text-sm text-[var(--ink-soft)]">
              <span className="text-xs text-[var(--muted)]">Контакт поставщика:&nbsp;</span>
              {[supplier.contact_person, supplier.phone, supplier.email]
                .filter(Boolean)
                .join(" · ") || "—"}
            </div>
          ) : null}
        </div>
      </div>

      <Modal open={editOpen} onOpenChange={setEditOpen} title="Редактирование товара" wide>
        <ProductFormDialogBody
          initial={product}
          onSaved={(rec) => {
            setEditOpen(false);
            setProduct(rec);
            load();
          }}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/products" className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--ink)]">
      <ArrowLeft size={16} aria-hidden="true" /> К списку товаров
    </Link>
  );
}

function Metric({ label, value, danger }) {
  return (
    <div className="rounded-md border border-[var(--line)] bg-[var(--surface)] p-3">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className={"mt-0.5 text-base font-semibold tabular-nums " + (danger ? "text-[var(--danger)]" : "text-[var(--ink)]")}>
        {value}
      </p>
    </div>
  );
}
