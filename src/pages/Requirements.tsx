import { useState } from "react";
import Icon from "@/components/ui/icon";

const REQUIREMENTS = [
  { id: "REQ-001", title: "Многофакторная аутентификация", category: "Идентификация и аутентификация", severity: "critical", status: "active", source: "ГОСТ Р 57580", updated: "12.05.2026" },
  { id: "REQ-002", title: "Шифрование данных в покое", category: "Защита данных", severity: "critical", status: "active", source: "187-ФЗ", updated: "03.05.2026" },
  { id: "REQ-003", title: "Разграничение прав доступа", category: "Управление доступом", severity: "high", status: "active", source: "ГОСТ Р 57580", updated: "28.04.2026" },
  { id: "REQ-004", title: "Ведение журнала аудита", category: "Мониторинг и аудит", severity: "high", status: "active", source: "PCI DSS", updated: "20.04.2026" },
  { id: "REQ-005", title: "Сегментация сети", category: "Сетевая безопасность", severity: "high", status: "draft", source: "CIS Controls", updated: "15.04.2026" },
  { id: "REQ-006", title: "Управление уязвимостями", category: "Безопасность ПО", severity: "medium", status: "active", source: "ISO 27001", updated: "10.04.2026" },
  { id: "REQ-007", title: "Резервное копирование данных", category: "Непрерывность бизнеса", severity: "medium", status: "active", source: "187-ФЗ", updated: "05.04.2026" },
  { id: "REQ-008", title: "Защита от DDoS-атак", category: "Сетевая безопасность", severity: "medium", status: "review", source: "CIS Controls", updated: "01.04.2026" },
  { id: "REQ-009", title: "Антивирусная защита рабочих станций", category: "Защита конечных точек", severity: "medium", status: "active", source: "ГОСТ Р 57580", updated: "22.03.2026" },
  { id: "REQ-010", title: "Политика надёжных паролей", category: "Идентификация и аутентификация", severity: "low", status: "active", source: "ISO 27001", updated: "18.03.2026" },
];

const CATEGORIES = ["Все", "Идентификация и аутентификация", "Защита данных", "Управление доступом", "Мониторинг и аудит", "Сетевая безопасность", "Безопасность ПО", "Непрерывность бизнеса", "Защита конечных точек"];
const SEVERITIES = ["Все", "critical", "high", "medium", "low"];

const severityLabel = (s: string) => ({ critical: "Критический", high: "Высокий", medium: "Средний", low: "Низкий" }[s] || s);
const statusLabel = (s: string) => ({ active: "Активен", draft: "Черновик", review: "На проверке", archived: "Архив" }[s] || s);
const statusColor = (s: string) => ({ active: "var(--success)", draft: "var(--text-dim)", review: "var(--amber)", archived: "var(--text-dim)" }[s] || "var(--text-dim)");

export default function Requirements() {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("Все");
  const [sevFilter, setSevFilter] = useState("Все");
  const [selected, setSelected] = useState<typeof REQUIREMENTS[0] | null>(null);

  const filtered = REQUIREMENTS.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "Все" || r.category === catFilter;
    const matchSev = sevFilter === "Все" || r.severity === sevFilter;
    return matchSearch && matchCat && matchSev;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Требования ИБ</h1>
          <p className="text-sm text-sec mt-0.5">{REQUIREMENTS.length} требований в реестре</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-amber text-primary-foreground text-sm font-medium rounded hover:opacity-90 transition-opacity">
          <Icon name="Plus" size={16} />
          Добавить требование
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
          <input
            className="w-full pl-9 pr-3 py-2 bg-surface-1 border border-line rounded text-sm text-foreground placeholder:text-dim focus:outline-none focus:border-amber/50 transition-colors"
            placeholder="Поиск по ID или названию..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 bg-surface-1 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50 transition-colors"
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          className="px-3 py-2 bg-surface-1 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50 transition-colors"
          value={sevFilter}
          onChange={e => setSevFilter(e.target.value)}
        >
          {SEVERITIES.map(s => <option key={s} value={s}>{s === "Все" ? "Все приоритеты" : severityLabel(s)}</option>)}
        </select>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: "Критических", count: REQUIREMENTS.filter(r => r.severity === "critical").length, cls: "tag-critical" },
          { label: "Высоких", count: REQUIREMENTS.filter(r => r.severity === "high").length, cls: "tag-high" },
          { label: "Средних", count: REQUIREMENTS.filter(r => r.severity === "medium").length, cls: "tag-medium" },
          { label: "Низких", count: REQUIREMENTS.filter(r => r.severity === "low").length, cls: "tag-low" },
        ].map(s => (
          <div key={s.label} className="bg-surface-1 border border-line rounded p-3 flex items-center justify-between">
            <span className="text-xs text-sec">{s.label}</span>
            <span className={s.cls}>{s.count}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-24">ID</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider">Требование</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider">Категория</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-28">Приоритет</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-28">Статус</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-28">Источник</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-28">Обновлён</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((req, i) => (
              <tr
                key={req.id}
                className="border-b border-line/50 hover:bg-surface-1 cursor-pointer transition-colors group animate-fade-in"
                style={{ animationDelay: `${i * 0.03}s`, opacity: 0 }}
                onClick={() => setSelected(selected?.id === req.id ? null : req)}
              >
                <td className="py-3 px-3">
                  <span className="font-mono text-xs text-steel">{req.id}</span>
                </td>
                <td className="py-3 px-3 font-medium text-foreground">{req.title}</td>
                <td className="py-3 px-3 text-sec">{req.category}</td>
                <td className="py-3 px-3">
                  <span className={`tag-${req.severity}`}>{severityLabel(req.severity)}</span>
                </td>
                <td className="py-3 px-3">
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: statusColor(req.status) }}>
                    <span className="status-dot" style={{ background: statusColor(req.status) }}></span>
                    {statusLabel(req.status)}
                  </span>
                </td>
                <td className="py-3 px-3 text-sec font-mono text-xs">{req.source}</td>
                <td className="py-3 px-3 text-dim text-xs">{req.updated}</td>
                <td className="py-3 px-3">
                  <Icon name="ChevronRight" size={14} className="text-dim opacity-0 group-hover:opacity-100 transition-opacity" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-dim">
            <Icon name="SearchX" size={32} className="mb-3 opacity-40" />
            <p className="text-sm">Требования не найдены</p>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="mt-4 bg-surface-1 border border-line rounded p-4 animate-fade-in">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="font-mono text-xs text-steel mr-2">{selected.id}</span>
              <span className={`tag-${selected.severity}`}>{severityLabel(selected.severity)}</span>
            </div>
            <button onClick={() => setSelected(null)} className="text-dim hover:text-foreground transition-colors">
              <Icon name="X" size={16} />
            </button>
          </div>
          <h3 className="font-semibold text-foreground mb-3">{selected.title}</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><span className="text-dim block mb-1">Категория</span><span className="text-foreground">{selected.category}</span></div>
            <div><span className="text-dim block mb-1">Источник</span><span className="text-steel font-mono text-xs">{selected.source}</span></div>
            <div><span className="text-dim block mb-1">Статус</span><span style={{ color: statusColor(selected.status) }}>{statusLabel(selected.status)}</span></div>
          </div>
          <div className="mt-3 flex gap-2">
            <button className="px-3 py-1.5 text-xs bg-surface-2 border border-line rounded hover:border-amber/40 transition-colors text-foreground">Редактировать</button>
            <button className="px-3 py-1.5 text-xs bg-surface-2 border border-line rounded hover:border-steel/40 transition-colors text-foreground">Связать с архитектурой</button>
            <button className="px-3 py-1.5 text-xs bg-surface-2 border border-line rounded hover:border-steel/40 transition-colors text-foreground">История изменений</button>
          </div>
        </div>
      )}
    </div>
  );
}
