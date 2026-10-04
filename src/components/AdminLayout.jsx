import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Truck,
  LogOut,
  Menu,
  X,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext.jsx";
import { cn } from "@/lib/utils.js";

// Каркас панели: сворачиваемый сайдбар (на телефоне — выдвижная шторка).
// Сверху — логотип, снизу — текущий пользователь и переход в «Настройки».
// Иконки — тёмно-серые (--muted).

const NAV = [
  { to: "/", label: "Дашборд", icon: LayoutDashboard, end: true },
  { to: "/clients", label: "Клиенты", icon: Users },
  { to: "/products", label: "Товары", icon: Package },
  { to: "/orders", label: "Заказы", icon: ShoppingCart },
  { to: "/suppliers", label: "Поставщики", icon: Truck },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  // Смена маршрута закрывает мобильную шторку.
  useEffect(() => setMobileOpen(false), [location.pathname]);

  function nav(collapsedView) {
    return (
      <nav className="flex flex-1 flex-col gap-0.5 p-2" aria-label="Разделы панели">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={collapsedView ? label : undefined}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                collapsedView && "justify-center px-0",
                isActive
                  ? "bg-[var(--neutral-soft)] text-[var(--ink)]"
                  : "text-[var(--muted)] hover:bg-[var(--neutral-soft)] hover:text-[var(--ink)]",
              )
            }
          >
            <Icon size={18} className="shrink-0 text-[var(--muted)]" aria-hidden="true" />
            {!collapsedView && <span className="truncate">{label}</span>}
            {collapsedView && <span className="sr-only">{label}</span>}
          </NavLink>
        ))}
      </nav>
    );
  }

  function bottom(collapsedView) {
    return (
      <div className="border-t border-[var(--line)] p-2">
        <NavLink
          to="/settings"
          title={collapsedView ? "Настройки" : undefined}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
              collapsedView && "justify-center px-0",
              isActive
                ? "bg-[var(--neutral-soft)] text-[var(--ink)]"
                : "text-[var(--muted)] hover:bg-[var(--neutral-soft)] hover:text-[var(--ink)]",
            )
          }
        >
          <Settings size={18} className="shrink-0 text-[var(--muted)]" aria-hidden="true" />
          {!collapsedView && <span>Настройки</span>}
          {collapsedView && <span className="sr-only">Настройки</span>}
        </NavLink>
        <div className={cn("mt-1 flex items-center gap-2 rounded-md px-3 py-2", collapsedView && "justify-center px-0")}>
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--neutral-soft)] text-xs font-semibold text-[var(--ink)]"
            aria-hidden="true"
          >
            {(user?.name || user?.email || "?").trim().slice(0, 1).toUpperCase()}
          </span>
          {!collapsedView ? (
            <>
              <span className="min-w-0 flex-1 truncate text-xs text-[var(--ink-soft)]">
                {user?.name || user?.email || "—"}
              </span>
              <button
                type="button"
                onClick={() => logout()}
                className="rounded-md p-1.5 text-[var(--muted)] hover:bg-[var(--neutral-soft)] hover:text-[var(--ink)]"
                aria-label="Выйти"
                title="Выйти"
              >
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-md p-1.5 text-[var(--muted)] hover:bg-[var(--neutral-soft)] hover:text-[var(--ink)]"
              aria-label="Выйти"
              title="Выйти"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>
    );
  }

  const brand = (
    <div className={cn("flex h-12 items-center border-b border-[var(--line)]", collapsed ? "justify-center px-2" : "gap-2 px-4")}>
      <img src="/logo-ai.png" alt="" className="h-7 w-7 shrink-0 object-contain" />
      {!collapsed ? (
        <span className="truncate text-sm font-semibold tracking-tight text-[var(--ink)]">
          Панель управления
        </span>
      ) : null}
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="flex min-h-screen w-full bg-[var(--bg)]">
        {/* Десктопный сайдбар: развёрнутый или свёрнутый до иконок */}
        <aside
          className={cn(
            "sticky top-0 flex h-screen shrink-0 flex-col border-r border-[var(--line)] bg-[var(--surface)] transition-[width] duration-150 ease-out",
            collapsed ? "w-14" : "w-60",
          )}
        >
          {brand}
          {nav(collapsed)}
          {bottom(collapsed)}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="mx-2 mb-2 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs text-[var(--muted)] hover:bg-[var(--neutral-soft)] hover:text-[var(--ink)]"
            aria-label={collapsed ? "Развернуть меню" : "Свернуть меню"}
            aria-pressed={collapsed}
          >
            {collapsed ? (
              <PanelLeftOpen size={16} />
            ) : (
              <>
                <PanelLeftClose size={16} />
                <span>Свернуть</span>
              </>
            )}
          </button>
        </aside>

        {/* Мобильная шторка */}
        {mobileOpen ? (
          <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Меню">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-[var(--surface)] shadow-xl">
              <div className="flex h-12 items-center justify-between border-b border-[var(--line)] px-4">
                <span className="text-sm font-semibold text-[var(--ink)]">Меню</span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md p-1 text-[var(--muted)] hover:text-[var(--ink)]"
                  aria-label="Закрыть меню"
                >
                  <X size={18} />
                </button>
              </div>
              {nav(false)}
              {bottom(false)}
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Шапка рабочей области */}
          <header className="sticky top-0 z-30 flex h-12 items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--surface)] px-4">
            <button
              type="button"
              className="rounded-md p-2 text-[var(--muted)] hover:bg-[var(--neutral-soft)] md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Открыть меню"
            >
              <Menu size={20} />
            </button>
            <span className="truncate text-sm text-[var(--muted)]">
              Торговля — панель управления
            </span>
            <img src="/logo-ai.png" alt="" className="h-6 w-6 shrink-0 object-contain md:invisible" />
          </header>

          <main className="min-w-0 flex-1 p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
