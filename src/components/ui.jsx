import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils.js";

// Малые строительные блоки интерфейса панели: бейдж, поле формы, диалог.

export function Badge({ children, color, soft, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        className,
      )}
      style={{ color: color ?? "var(--muted)", backgroundColor: soft ?? "var(--neutral-soft)" }}
    >
      {children}
    </span>
  );
}

export function Field({ label, required, children, className }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-medium text-[var(--muted)]">
        {label}
        {required ? <span className="text-[var(--danger)]"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

const controlCls =
  "w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] disabled:opacity-60";

export function TextInput(props) {
  return <input {...props} className={cn(controlCls, "h-9", props.className)} />;
}

export function TextArea(props) {
  return <textarea rows={3} {...props} className={cn(controlCls, props.className)} />;
}

export function Select({ children, className, ...props }) {
  return (
    <select {...props} className={cn(controlCls, "h-9", className)}>
      {children}
    </select>
  );
}

// Диалог: заголовок обязателен, закрытие по Escape и крестику — из Radix.
export function Modal({ open, onOpenChange, title, children, wide }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 shadow-xl focus:outline-none",
            wide ? "sm:max-w-3xl" : "sm:max-w-lg",
          )}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <Dialog.Title className="text-base font-semibold text-[var(--ink)]">
              {title}
            </Dialog.Title>
            <Dialog.Close
              className="rounded-md p-1 text-[var(--muted)] hover:bg-[var(--neutral-soft)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              aria-label="Закрыть"
            >
              <X size={18} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-md border border-[var(--line)] bg-[var(--surface)] p-6 text-sm text-[var(--danger)]">
      <p>{message ?? "Не удалось загрузить данные."}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 text-[var(--ink)] underline underline-offset-4 hover:text-[var(--accent)]"
        >
          Повторить
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ title, hint, action }) {
  return (
    <div className="rounded-md border border-dashed border-[var(--line)] bg-[var(--surface)] p-8 text-center">
      <p className="text-sm font-medium text-[var(--ink)]">{title ?? "Пока пусто"}</p>
      {hint ? <p className="mt-1 text-sm text-[var(--muted)]">{hint}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Loading() {
  return (
    <div className="rounded-md border border-[var(--line)] bg-[var(--surface)] p-8 text-sm text-[var(--muted)]" aria-busy="true">
      Загрузка…
    </div>
  );
}
