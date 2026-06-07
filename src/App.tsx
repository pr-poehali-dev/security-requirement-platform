import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Icon from "@/components/ui/icon";
import Dashboard from "@/pages/Dashboard";
import Requirements from "@/pages/Requirements";
import Architectures from "@/pages/Architectures";
import Templates from "@/pages/Templates";
import Users from "@/pages/Users";
import Settings from "@/pages/Settings";
import OrgDomains from "@/pages/OrgDomains";

type Section = "dashboard" | "requirements" | "architectures" | "templates" | "orgdomains" | "users" | "settings";

const NAV_ITEMS: { id: Section; label: string; icon: string; group: string }[] = [
  { id: "dashboard", label: "Обзор", icon: "LayoutDashboard", group: "Платформа" },
  { id: "requirements", label: "Требования", icon: "FileText", group: "Управление" },
  { id: "architectures", label: "Архитектуры", icon: "Network", group: "Управление" },
  { id: "templates", label: "Шаблоны", icon: "LayoutTemplate", group: "Управление" },
  { id: "orgdomains", label: "Орг. домены", icon: "Building", group: "Управление" },
  { id: "users", label: "Пользователи", icon: "Users", group: "Администрирование" },
  { id: "settings", label: "Настройки", icon: "Settings", group: "Администрирование" },
];

const SECTION_COMPONENTS: Record<Section, React.FC> = {
  dashboard: Dashboard,
  requirements: Requirements,
  architectures: Architectures,
  templates: Templates,
  orgdomains: OrgDomains,
  users: Users,
  settings: Settings,
};

const groups = [...new Set(NAV_ITEMS.map(i => i.group))];

export default function App() {
  const [section, setSection] = useState<Section>(() => {
    return (localStorage.getItem("secarch_section") as Section) || "dashboard";
  });
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("secarch_collapsed") === "true";
  });
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("secarch_theme");
    const dark = saved !== null ? saved === "dark" : true;
    document.documentElement.classList.toggle("light", !dark);
    return dark;
  });

  useEffect(() => {
    localStorage.setItem("secarch_section", section);
  }, [section]);

  useEffect(() => {
    localStorage.setItem("secarch_collapsed", String(collapsed));
  }, [collapsed]);

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      document.documentElement.classList.toggle("light", !next);
      localStorage.setItem("secarch_theme", next ? "dark" : "light");
      return next;
    });
  };

  const activeItem = NAV_ITEMS.find(i => i.id === section);

  return (
    <TooltipProvider>
      <Toaster />
      <div className="flex h-screen bg-background overflow-hidden font-sans">
        {/* Sidebar */}
        <aside
          className="flex flex-col border-r border-line transition-all duration-200 shrink-0"
          style={{ width: collapsed ? "56px" : "220px", background: "hsl(var(--sidebar-background))" }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-line/60 shrink-0">
            <div
              className="w-7 h-7 rounded flex items-center justify-center shrink-0 glow-amber"
              style={{ background: "hsl(var(--amber))", color: "hsl(var(--primary-foreground))" }}
            >
              <Icon name="ShieldCheck" size={15} />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <div className="text-sm font-bold text-foreground leading-tight tracking-tight">SecureArch</div>
                <div className="text-xs text-dim leading-tight">Платформа ИБ</div>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
            {groups.map(group => {
              const items = NAV_ITEMS.filter(i => i.group === group);
              return (
                <div key={group} className="mb-3">
                  {!collapsed && (
                    <div className="px-4 mb-1 text-xs text-dim uppercase tracking-widest font-medium">
                      {group}
                    </div>
                  )}
                  {items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSection(item.id)}
                      title={collapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all relative ${
                        section === item.id
                          ? "text-amber"
                          : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent"
                      }`}
                    >
                      {section === item.id && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber rounded-r"></span>
                      )}
                      <Icon
                        name={item.icon as "LayoutDashboard"}
                        size={16}
                        className={`shrink-0 transition-colors ${section === item.id ? "text-amber" : ""}`}
                      />
                      {!collapsed && (
                        <span className={`font-medium truncate ${section === item.id ? "text-amber" : ""}`}>
                          {item.label}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              );
            })}
          </nav>

          {/* Collapse toggle */}
          <div className="border-t border-line/60 p-3 shrink-0">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-center p-2 rounded text-dim hover:text-foreground hover:bg-sidebar-accent transition-colors"
              title={collapsed ? "Развернуть" : "Свернуть"}
            >
              <Icon name={collapsed ? "PanelLeftOpen" : "PanelLeftClose"} size={15} />
            </button>
          </div>
        </aside>

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top bar */}
          <header
            className="flex items-center justify-between px-6 py-3 border-b border-line shrink-0"
            style={{ background: "hsl(var(--surface-1))" }}
          >
            <div className="flex items-center gap-2 text-sm">
              <span className="text-dim">SecureArch</span>
              <Icon name="ChevronRight" size={13} className="text-dim" />
              <span className="text-foreground font-medium">{activeItem?.label}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Icon name="Search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dim" />
                <input
                  className="pl-8 pr-3 py-1.5 bg-surface-2 border border-line rounded text-xs text-foreground placeholder:text-dim focus:outline-none focus:border-amber/40 transition-colors w-48"
                  placeholder="Глобальный поиск..."
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-dim font-mono">⌘K</span>
              </div>

              <button
                onClick={toggleTheme}
                title={isDark ? "Светлая тема" : "Тёмная тема"}
                className="w-8 h-8 flex items-center justify-center rounded border border-line bg-surface-2 text-dim hover:text-foreground transition-colors"
              >
                <Icon name={isDark ? "Sun" : "Moon"} size={14} />
              </button>

              <button className="relative w-8 h-8 flex items-center justify-center rounded border border-line bg-surface-2 text-dim hover:text-foreground transition-colors">
                <Icon name="Bell" size={14} />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber animate-pulse-amber"></span>
              </button>

              <div className="flex items-center gap-2 pl-3 border-l border-line">
                <div className="w-7 h-7 rounded-full bg-surface-3 border border-amber/30 flex items-center justify-center text-xs font-semibold text-amber">
                  АП
                </div>
                {!collapsed && (
                  <div className="hidden md:block">
                    <div className="text-xs font-medium text-foreground leading-tight">А. Петров</div>
                    <div className="text-xs text-dim leading-tight">Администратор</div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Page content — все страницы рендерятся один раз, неактивные скрыты */}
          <main className="flex-1 overflow-auto p-6">
            {(Object.keys(SECTION_COMPONENTS) as Section[]).map(id => {
              const Page = SECTION_COMPONENTS[id];
              return (
                <div key={id} style={{ display: section === id ? "block" : "none" }} className="h-full">
                  <Page />
                </div>
              );
            })}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}