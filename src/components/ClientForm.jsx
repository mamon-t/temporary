import { useEffect, useState } from "react";
import { entities, VibeliError } from "@/lib/vibeli.js";
import { Button } from "@/components/ui/button.jsx";
import { Field, TextInput, TextArea, Select } from "@/components/ui.jsx";

// Форма клиента: переключатель «частное лицо / юридическое лицо».
// Для юрлица — полный набор реквизитов (ИНН, КПП, ОГРН, адрес, банк, счёта,
// подписант), для частного — обычные контактные поля.

const EMPTY = {
  kind: "company",
  name: "",
  status: "active",
  phone: "",
  email: "",
  address: "",
  website: "",
  inn: "",
  kpp: "",
  ogrn: "",
  legal_address: "",
  bank_name: "",
  bik: "",
  account: "",
  corr_account: "",
  signer: "",
  comment: "",
};

export function ClientFormDialogBody({ initial, onSaved, onCancel }) {
  const editing = Boolean(initial?.id);
  const [form, setForm] = useState(() => ({ ...EMPTY, ...stripEmpty(initial) }));
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...EMPTY, ...stripEmpty(initial) });
  }, [initial]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    if (!form.name.trim()) return "Укажите наименование или ФИО.";
    if (form.kind === "company" && form.inn && !/^\d{10,12}$/.test(form.inn.trim()))
      return "ИНН должен содержать 10 или 12 цифр.";
    if (form.email && !/.+@.+\..+/.test(form.email.trim())) return "Проверьте формат e-mail.";
    return null;
  }

  async function submit(e) {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const data = { ...form, name: form.name.trim() };
      const saved = editing
        ? await entities.Client.update(initial.id, data)
        : await entities.Client.create(data);
      onSaved(saved);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof VibeliError && err.code === "validation"
          ? "Проверьте заполнение полей: " + (err.message ?? "")
          : "Не удалось сохранить клиента. Попробуйте ещё раз.",
      );
    } finally {
      setSaving(false);
    }
  }

  const isCompany = form.kind === "company";

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Тип клиента" required>
          <Select value={form.kind} onChange={set("kind")}>
            <option value="company">Юридическое лицо</option>
            <option value="person">Частное лицо</option>
          </Select>
        </Field>
        <Field label="Статус">
          <Select value={form.status} onChange={set("status")}>
            <option value="active">Активен</option>
            <option value="archived">В архиве</option>
          </Select>
        </Field>
      </div>

      <Field label={isCompany ? "Наименование организации" : "ФИО"} required>
        <TextInput value={form.name} onChange={set("name")} required />
      </Field>

      {isCompany ? (
        <fieldset className="rounded-md border border-[var(--line)] p-4">
          <legend className="px-1 text-xs font-medium text-[var(--muted)]">Реквизиты</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="ИНН">
              <TextInput value={form.inn} onChange={set("inn")} inputMode="numeric" />
            </Field>
            <Field label="КПП">
              <TextInput value={form.kpp} onChange={set("kpp")} inputMode="numeric" />
            </Field>
            <Field label="ОГРН">
              <TextInput value={form.ogrn} onChange={set("ogrn")} inputMode="numeric" />
            </Field>
          </div>
          <div className="mt-4 space-y-4">
            <Field label="Юридический адрес">
              <TextArea value={form.legal_address} onChange={set("legal_address")} />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Банк">
                <TextInput value={form.bank_name} onChange={set("bank_name")} />
              </Field>
              <Field label="БИК">
                <TextInput value={form.bik} onChange={set("bik")} inputMode="numeric" />
              </Field>
              <Field label="Расчётный счёт">
                <TextInput value={form.account} onChange={set("account")} inputMode="numeric" />
              </Field>
              <Field label="Корреспондентский счёт">
                <TextInput
                  value={form.corr_account}
                  onChange={set("corr_account")}
                  inputMode="numeric"
                />
              </Field>
            </div>
            <Field label="Подписант">
              <TextInput
                value={form.signer}
                onChange={set("signer")}
                placeholder="Должность, ФИО, основание полномочий"
              />
            </Field>
          </div>
        </fieldset>
      ) : null}

      <fieldset className="rounded-md border border-[var(--line)] p-4">
        <legend className="px-1 text-xs font-medium text-[var(--muted)]">Контакты</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        <div className="mt-4">
          <Field label="Адрес">
            <TextArea value={form.address} onChange={set("address")} />
          </Field>
        </div>
      </fieldset>

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
          {saving ? "Сохраняем…" : editing ? "Сохранить" : "Создать клиента"}
        </Button>
      </div>
    </form>
  );
}

function stripEmpty(rec) {
  if (!rec) return {};
  const out = {};
  for (const [k, v] of Object.entries(rec)) {
    if (v != null) out[k] = v;
  }
  return out;
}
