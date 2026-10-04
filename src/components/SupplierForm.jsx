import { useState } from "react";
import { entities, VibeliError } from "@/lib/vibeli.js";
import { Button } from "@/components/ui/button.jsx";
import { Field, TextInput, TextArea } from "@/components/ui.jsx";

// Упрощённая карточка поставщика.

const EMPTY = { name: "", contact_person: "", phone: "", email: "", website: "", comment: "" };

export function SupplierFormDialogBody({ initial, onSaved, onCancel }) {
  const editing = Boolean(initial?.id);
  const [form, setForm] = useState(() => ({ ...EMPTY, ...pick(initial) }));
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Укажите название поставщика.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = editing
        ? await entities.Supplier.update(initial.id, form)
        : await entities.Supplier.create(form);
      onSaved(saved);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof VibeliError && err.code === "validation"
          ? "Проверьте заполнение полей: " + (err.message ?? "")
          : "Не удалось сохранить поставщика. Попробуйте ещё раз.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Название" required>
        <TextInput value={form.name} onChange={set("name")} required />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Контактное лицо">
          <TextInput value={form.contact_person} onChange={set("contact_person")} />
        </Field>
        <Field label="Телефон">
          <TextInput type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} />
        </Field>
        <Field label="E-mail">
          <TextInput type="email" value={form.email} onChange={set("email")} />
        </Field>
        <Field label="Сайт">
          <TextInput value={form.website} onChange={set("website")} />
        </Field>
      </div>
      <Field label="Комментарий">
        <TextArea value={form.comment} onChange={set("comment")} />
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
          {saving ? "Сохраняем…" : editing ? "Сохранить" : "Создать поставщика"}
        </Button>
      </div>
    </form>
  );
}

function pick(rec) {
  if (!rec) return {};
  const out = {};
  for (const [k, v] of Object.entries(rec)) if (v != null) out[k] = v;
  return out;
}
