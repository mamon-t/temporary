import { EmptyState } from "@/components/ui.jsx";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";

// Заглушка раздела настроек — под будущую реализацию владельца.
// Явно сообщает, что здесь пока ничего нет.

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--ink)]">
        <ArrowLeft size={16} aria-hidden="true" /> К дашборду
      </Link>
      <header className="flex items-center gap-2">
        <Settings size={18} className="text-[var(--muted)]" aria-hidden="true" />
        <h1 className="text-xl font-semibold text-[var(--ink)]">Настройки</h1>
      </header>
      <EmptyState
        title="Раздел настроек ещё не готов"
        hint="Здесь появятся настройки панели. Заметка для реализации — страница уже подключена в меню."
      />
    </div>
  );
}
