import { useEffect, useState } from "react";
import { entities, integrations } from "@/lib/vibeli.js";
import { Button } from "@/components/ui/button.jsx";
import { Modal } from "@/components/ui.jsx";
import { downloadCsv } from "@/lib/csv.js";
import { FileSpreadsheet } from "lucide-react";

// Импорт товаров из Excel/CSV: файл → извлечение данных → предпросмотр → запись.
// Колонки: name (обязательно), sku, category, unit, price, stock, manufacturer,
// manufacturer_url, supplier, last_supply_date, description.

const SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          sku: { type: "string" },
          category: { type: "string" },
          unit: { type: "string" },
          price: { type: "number" },
          stock: { type: "number" },
          manufacturer: { type: "string" },
          manufacturer_url: { type: "string" },
          supplier: { type: "string" },
          last_supply_date: { type: "string" },
          description: { type: "string" },
        },
        required: ["name", "price"],
      },
    },
  },
  required: ["items"],
};

const COLUMNS = [
  "name",
  "sku",
  "category",
  "unit",
  "price",
  "stock",
  "manufacturer",
  "manufacturer_url",
  "supplier",
  "last_supply_date",
  "description",
];

export function sampleCsv() {
  const rows = [
    {
      name: "Бумага А4 80 г/м², 500 л.",
      sku: "00011",
      category: "Бумага",
      unit: "уп",
      price: 490,
      stock: 100,
      manufacturer: "Кондор-Групп",
      manufacturer_url: "https://kondor-group.ru",
      supplier: "ООО «БумОпт Трейд»",
      last_supply_date: "2026-09-29",
      description: "Образец строки для импорта.",
    },
    {
      name: "Ручка гелевая 0,5 синяя",
      sku: "00021",
      category: "Канцелярия",
      unit: "шт",
      price: 28,
      stock: 500,
      manufacturer: "Полир-Канц",
      manufacturer_url: "https://polir-kanc.ru",
      supplier: "ООО «КанцМаркет»",
      last_supply_date: "2026-09-15",
      description: "",
    },
  ];
  downloadCsv("primer-import-tovarov.csv", COLUMNS.map((c) => ({ key: c, label: c })), rows);
}

export function ImportDialog({ open, onOpenChange, onImported }) {
  const [stage, setStage] = useState("idle"); // idle | extracting | preview | importing | done | error
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState(null);
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    if (!open) return;
    entities.Supplier.list({ limit: 200 })
      .then((p) => setSuppliers(p.items))
      .catch((e) => console.error(e));
    setStage("idle");
    setRows([]);
    setMessage(null);
  }, [open]);

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStage("extracting");
    setMessage(null);
    try {
      const { file_url } = await integrations.Core.UploadFile({ file });
      const res = await integrations.Core.ExtractDataFromUploadedFile({ file_url, json_schema: SCHEMA });
      if (res.status !== "success" || !Array.isArray(res.output?.items) || !res.output.items.length) {
        setStage("error");
        setMessage(
          res.status === "success"
            ? "В файле не найдено ни одной строки с названием и ценой."
            : "Не удалось прочитать файл: " + (res.details ?? "неизвестная ошибка"),
        );
        return;
      }
      setRows(res.output.items);
      setStage("preview");
    } catch (err) {
      console.error(err);
      setStage("error");
      setMessage(
        err?.code === "capability_unavailable"
          ? "Извлечение данных из файлов сейчас недоступно в этом окружении."
          : "Не удалось обработать файл. Попробуйте другой файл.",
      );
    } finally {
      e.target.value = "";
    }
  }

  async function doImport() {
    setStage("importing");
    try {
      const supMap = new Map(
        suppliers.map((s) => [String(s.name).trim().toLowerCase(), s.id]),
      );
      let created = 0;
      let skipped = 0;
      for (const r of rows) {
        const price = Number(r.price);
        const name = String(r.name ?? "").trim();
        if (!name || !Number.isFinite(price)) {
          skipped++;
          continue;
        }
        await entities.Product.create({
          name,
          sku: String(r.sku ?? "").trim(),
          category: String(r.category ?? ""),
          unit: String(r.unit ?? "шт") || "шт",
          price,
          stock: Number.isFinite(Number(r.stock)) ? Math.max(0, Math.trunc(Number(r.stock))) : 0,
          manufacturer: String(r.manufacturer ?? ""),
          manufacturer_url: String(r.manufacturer_url ?? ""),
          supplier_id: supMap.get(String(r.supplier ?? "").trim().toLowerCase()) ?? null,
          last_supply_date: r.last_supply_date
            ? new Date(r.last_supply_date).toISOString()
            : null,
          description: String(r.description ?? ""),
        });
        created++;
      }
      setStage("done");
      setMessage(
        skipped > 0
          ? "Импортировано товаров: " + created + ". Пропущено без названия или цены: " + skipped + "."
          : "Импортировано товаров: " + created + ".",
      );
      if (created > 0) onImported();
    } catch (err) {
      console.error(err);
      setStage("error");
      setMessage("Часть товаров не удалось записать. Попробуйте ещё раз.");
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Импорт товаров из Excel/CSV" wide>
      {stage === "idle" || stage === "error" ? (
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">
            Поддерживаются .xlsx, .csv, .tsv. Обязательные колонки — <code>name</code> и{" "}
            <code>price</code>; остальные распознаются автоматически.
          </p>
          <div className="flex flex-wrap gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)] hover:bg-[var(--surface-hover)]">
              <FileSpreadsheet size={16} className="text-[var(--muted)]" aria-hidden="true" />
              Выбрать файл
              <input
                type="file"
                accept=".xlsx,.csv,.tsv,.txt"
                className="sr-only"
                onChange={onFile}
                disabled={stage === "extracting"}
              />
            </label>
            <Button type="button" variant="ghost" size="sm" onClick={sampleCsv}>
              Скачать пример CSV
            </Button>
          </div>
          {stage === "extracting" ? <p className="text-sm text-[var(--muted)]">Читаем файл…</p> : null}
          {message ? (
            <p className="text-sm text-[var(--danger)]" role="alert">
              {message}
            </p>
          ) : null}
        </div>
      ) : stage === "preview" || stage === "importing" ? (
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">
            Найдено строк: {rows.length}. Проверьте предпросмотр перед записью.
          </p>
          <div className="max-h-64 overflow-auto rounded-md border border-[var(--line)]">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="bg-[var(--neutral-soft)] text-[var(--muted)]">
                <tr>
                  <th className="px-2 py-1.5">Название</th>
                  <th className="px-2 py-1.5">Артикул</th>
                  <th className="px-2 py-1.5">Цена</th>
                  <th className="px-2 py-1.5">Остаток</th>
                  <th className="px-2 py-1.5">Производитель</th>
                  <th className="px-2 py-1.5">Поставщик</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 100).map((r, i) => (
                  <tr key={i} className="border-t border-[var(--line)]">
                    <td className="px-2 py-1.5">{String(r.name ?? "")}</td>
                    <td className="px-2 py-1.5">{String(r.sku ?? "")}</td>
                    <td className="px-2 py-1.5 tabular-nums">{String(r.price ?? "")}</td>
                    <td className="px-2 py-1.5 tabular-nums">{String(r.stock ?? "")}</td>
                    <td className="px-2 py-1.5">{String(r.manufacturer ?? "")}</td>
                    <td className="px-2 py-1.5">{String(r.supplier ?? "")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStage("idle");
                setRows([]);
              }}
              disabled={stage === "importing"}
            >
              Назад
            </Button>
            <Button type="button" onClick={doImport} disabled={stage === "importing"}>
              {stage === "importing" ? "Записываем…" : "Импортировать " + rows.length + " товаров"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-[var(--ink)]" role="status">
            {message ?? "Готово."}
          </p>
          <div className="flex justify-end">
            <Button type="button" onClick={() => onOpenChange(false)}>
              Закрыть
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
