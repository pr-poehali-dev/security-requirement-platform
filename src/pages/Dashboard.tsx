import Icon from "@/components/ui/icon";

const STATS = [
  { label: "Требований в реестре", value: "10", delta: "+2 за месяц", icon: "FileText", color: "var(--amber)" },
  { label: "Архитектур", value: "5", delta: "1 на проверке", icon: "Network", color: "var(--steel)" },
  { label: "Шаблонов", value: "6", delta: "По 6 отраслям", icon: "LayoutTemplate", color: "var(--success)" },
  { label: "Активных пользователей", value: "6", delta: "из 8 сотрудников", icon: "Users", color: "var(--text-secondary)" },
];

const RECENT_ACTIVITY = [
  { time: "09:14", user: "А. Петров", action: "Обновил требование", target: "REQ-003", type: "update" },
  { time: "08:50", user: "И. Смирнова", action: "Создала архитектуру", target: "ARCH-005", type: "create" },
  { time: "17:22 вч.", user: "М. Козлов", action: "Применил шаблон", target: "TPL-003", type: "action" },
  { time: "16:10 вч.", user: "А. Петров", action: "Изменил роль", target: "USR-0006", type: "update" },
];

const COMPLIANCE = [
  { standard: "ГОСТ Р 57580", coverage: 78, reqs: 18 },
  { standard: "187-ФЗ", coverage: 92, reqs: 24 },
  { standard: "ISO 27001", coverage: 61, reqs: 15 },
  { standard: "PCI DSS", coverage: 45, reqs: 9 },
];

const SEVERITY_DIST = [
  { label: "Критических", count: 2, color: "var(--danger)", pct: 20 },
  { label: "Высоких", count: 3, color: "hsl(28 85% 60%)", pct: 30 },
  { label: "Средних", count: 4, color: "var(--amber)", pct: 40 },
  { label: "Низких", count: 1, color: "var(--success)", pct: 10 },
];

const actionColor = (t: string) => ({
  create: "var(--success)", update: "var(--amber)", delete: "var(--danger)", action: "var(--steel)"
}[t] || "var(--text-dim)");

export default function Dashboard() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Панель управления</h1>
          <p className="text-sm text-sec mt-0.5">6 июня 2026 · Служба информационной безопасности</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-sec bg-surface-1 border border-line px-3 py-1.5 rounded">
          <span className="status-dot bg-amber animate-pulse-amber"></span>
          Синхронизация с AD активна
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className="bg-surface-1 border border-line rounded p-4 animate-fade-in"
            style={{ animationDelay: `${i * 0.07}s`, opacity: 0 }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-dim uppercase tracking-wider">{s.label}</span>
              <div className="w-7 h-7 rounded bg-surface-2 flex items-center justify-center">
                <Icon name={s.icon as "FileText"} size={14} style={{ color: s.color }} />
              </div>
            </div>
            <div className="text-2xl font-semibold text-foreground mb-1">{s.value}</div>
            <div className="text-xs text-dim">{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Compliance coverage */}
        <div className="col-span-2 bg-surface-1 border border-line rounded p-4 animate-fade-in stagger-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Покрытие стандартов</h2>
            <span className="tag-info">Актуально</span>
          </div>
          <div className="space-y-4">
            {COMPLIANCE.map(c => (
              <div key={c.standard}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-foreground font-mono">{c.standard}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-dim">{c.reqs} требований</span>
                    <span className="font-semibold" style={{ color: c.coverage >= 80 ? "var(--success)" : c.coverage >= 60 ? "var(--amber)" : "var(--danger)" }}>
                      {c.coverage}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${c.coverage}%`,
                      background: c.coverage >= 80 ? "var(--success)" : c.coverage >= 60 ? "var(--amber)" : "var(--danger)"
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Severity distribution */}
        <div className="bg-surface-1 border border-line rounded p-4 animate-fade-in stagger-3">
          <h2 className="text-sm font-semibold text-foreground mb-4">Распределение приоритетов</h2>
          <div className="space-y-3">
            {SEVERITY_DIST.map(s => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }}></div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-sec">{s.label}</span>
                    <span className="text-foreground font-medium">{s.count}</span>
                  </div>
                  <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.color }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-line">
            <p className="text-xs text-dim mb-2">Архитектуры по статусу</p>
            <div className="flex gap-2">
              {[
                { label: "Утверждено", count: 3, color: "var(--success)" },
                { label: "На проверке", count: 1, color: "var(--amber)" },
                { label: "Черновик", count: 1, color: "var(--text-dim)" },
              ].map(s => (
                <div key={s.label} className="flex-1 bg-surface-2 rounded p-2 text-center">
                  <div className="text-base font-semibold" style={{ color: s.color }}>{s.count}</div>
                  <div className="text-xs text-dim mt-0.5 leading-tight">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity + Quick actions */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-surface-1 border border-line rounded p-4 animate-fade-in stagger-4">
          <h2 className="text-sm font-semibold text-foreground mb-4">Последние действия</h2>
          <div className="space-y-0">
            {RECENT_ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-line/40 last:border-0">
                <span className="text-xs text-dim font-mono w-16 shrink-0">{a.time}</span>
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: actionColor(a.type) }}></div>
                <span className="text-sm text-sec flex-1">{a.user} <span className="text-dim">{a.action}</span></span>
                <span className="text-xs font-mono" style={{ color: actionColor(a.type) }}>{a.target}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-1 border border-line rounded p-4 animate-fade-in stagger-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Быстрые действия</h2>
          <div className="space-y-2">
            {[
              { label: "Добавить требование", icon: "FilePlus", color: "var(--amber)" },
              { label: "Создать архитектуру", icon: "PlusSquare", color: "var(--steel)" },
              { label: "Применить шаблон", icon: "LayoutTemplate", color: "var(--success)" },
              { label: "Пригласить пользователя", icon: "UserPlus", color: "var(--text-secondary)" },
              { label: "Экспорт отчёта", icon: "FileDown", color: "var(--text-dim)" },
            ].map(a => (
              <button
                key={a.label}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-surface-2 hover:bg-surface-3 border border-line hover:border-amber/20 rounded text-sm text-sec hover:text-foreground transition-all text-left"
              >
                <Icon name={a.icon as "FilePlus"} size={14} style={{ color: a.color }} />
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
