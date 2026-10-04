// Экспорт CSV на клиенте: из уже загруженных списков, без бэкенда.
// BOM в начале — чтобы Excel корректно открывал кириллицу.

function esc(v) {
  const s = v == null ? "" : String(v);
  if (/[",;\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export function toCsv(headers, rows) {
  const head = headers.map((h) => esc(h.label)).join(";");
  const body = rows
    .map((r) => headers.map((h) => esc(r[h.key])).join(";"))
    .join("\n");
  return "\uFEFF" + head + "\n" + body;
}

export function downloadCsv(filename, headers, rows) {
  const blob = new Blob([toCsv(headers, rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
