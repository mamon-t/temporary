import { useEffect, useState } from "react";
import { entities, integrations, VibeliError } from "@/lib/vibeli.js";
import { Button } from "@/components/ui/button.jsx";
import { Field, TextInput, TextArea, Select } from "@/components/ui.jsx";
import { Upload } from "lucide-react";

// Форма товара: цена, остаток, производитель с ссылкой на сайт, поставщик,
// дата последнего поступления и необязательное фото (ссылка или файл).

const EMPTY = {
  name: "",
  sku: "",
  category: "",
  unit: "шт",
  price: "",
  stock: 0,
  manufacturer: "",
  manufacturer_url: "",
  supplier_id: "",
  last_supply_date: "",
  photo_url: "",
  description: "",
};

export function ProductFormDialogBody({ initial, onSaved, onCancel }) {
  const editing = Boolean(initial?.id);
  const [form, setForm] = useState(() => ({ ...EMPTY, ...toStr(initial) }));
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setForm({ ...EMPTY, ...toStr(initial) });
  }, [initial]);

  useEffect(() => {
    let alive = true;
    entities.Supplier.list({ sort: [{ field: "name", dir: "asc" }], limit: 200 })
      .then((page) => alive && setSuppliers(page.items))
      .catch((e) => console.error(e));
    return () => {
      alive = false;
    };
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { file_url } = await integrations.Core.UploadFile({ file });
      setForm((f) => ({ ...f, photo_url: file_url }));
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить фото. Попробуйте ещё раз.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Укажите название товара.");
      return;
    }
    const price = Number(String(form.price).replace(",", "."));
    if (!Number.isFinite(price) || price <= 0) {
      setError("Цена должна быть числом больше нуля.");
      return;
    }
    const stock = Number.isFinite(Number(form.stock)) ? Math.max(0, Math.trunc(Number(form.stock))) : 0;
    setSaving(true);
    setError(null);
    try {
      const data = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        category: form.category,
        unit: form.unit || "шт",
        price,
        stock,
        manufacturer: form.manufacturer,
        manufacturer_url: form.manufacturer_url,
        supplier_id: form.supplier_id || null,
        last_supply_date: form.last_supply_date ? new Date(form.last_supply_date).toISOString() : null,
        photo_url: form.photo_url || null,
        description: form.description,
      };
      const saved = editing
        ? await entities.Product.update(initial.id, data)
        : await entities.Product.create(data);
      onSaved(saved);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof VibeliError && err.code === "validation"
          ? "Проверьте заполнение полей: " + (err.message ?? "")
          : "Не удалось сохранить товар. Попробуйте ещё раз.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Название" required className="sm:col-span-2">
          <TextInput value={form.name} onChange={set("name")} required />
        </Field>
        <Field label="Артикул">
          <TextInput value={form.sku} onChange={set("sku")} />
        </Field>
        <Field label="Категория">
          <TextInput value={form.category} onChange={set("category")} />
        </Field>
        <Field label="Цена, ₽" required>
          <TextInput
            value={form.price}
            onChange={set("price")}
            inputMode="decimal"
            placeholder="0,00"
          />
        </Field>
        <Field label="Единица">
          <TextInput value={form.unit} onChange={set("unit")} />
        </Field>
        <Field label="Остаток на складе">
          <TextInput value={form.stock} onChange={set("stock")} inputMode="numeric" />
        </Field>
        <Field label="Дата последнего поступления">
          <TextInput type="date" value={form.last_supply_date} onChange={set("last_supply_date")} />
        </Field>
        <Field label="Производитель">
          <TextInput value={form.manufacturer} onChange={set("manufacturer")} />
        </Field>
        <Field label="Сайт производителя">
          <TextInput
            type="url"
            value={form.manufacturer_url}
            onChange={set("manufacturer_url")}
            placeholder="https://…"
          />
        </Field>
        <Field label="Поставщик" className="sm:col-span-2">
          <Select value={form.supplier_id ?? ""} onChange={set("supplier_id")}>
            <option value="">— не выбран —</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Фото (необязательно)">
        <div className="flex flex-wrap items-center gap-3">
          {form.photo_url ? (
            <img
              src={form.photo_url}
              alt=""
              className="h-16 w-16 rounded-md border border-[var(--line)] object-cover"
            />
          ) : null}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)] hover:bg-[var(--surface-hover)]">
            <Upload size={16} className="text-[var(--muted)]" aria-hidden="true" />
            {uploading ? "Загружаем…" : "Загрузить файл"}
            <input type="file" accept="image/*" className="sr-only" onChange={onPhoto} disabled={uploading} />
          </label>
          {form.photo_url ? (
            <button
              type="button"
              className="text-sm text-[var(--muted)] underline underline-offset-4 hover:text-[var(--ink)]"
              onClick={() => setForm((f) => ({ ...f, photo_url: "" }))}
            >
              Убрать фото
            </button>
          ) : null}
        </div>
      </Field>

      <Field label="Описание">
        <TextArea value={form.description} onChange={set("description")} />
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
        <Button type="submit" disabled={saving || uploading}>
          {saving ? "Сохраняем…" : editing ? "Сохранить" : "Создать товар"}
        </Button>
      </div>
    </form>
  );
}

function toStr(rec) {
  if (!rec) return {};
  const out = {};
  for (const [k, v] of Object.entries(rec)) {
    if (v == null) continue;
    if (k === "last_supply_date") out[k] = String(v).slice(0, 10);
    else out[k] = v;
  }
  return out;
}
