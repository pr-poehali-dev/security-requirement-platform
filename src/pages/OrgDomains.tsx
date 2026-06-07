import { useState } from "react";
import Icon from "@/components/ui/icon";

type DomainStatus = "active" | "dev" | "inactive" | "archived";

interface OrgDomain {
  id: string;
  name: string;
  owner: string;
  status: DomainStatus;
  description: string;
  version: number;
  updatedAt: string;
}

const STATUS_OPTIONS: { value: DomainStatus; label: string }[] = [
  { value: "active", label: "Активен" },
  { value: "dev", label: "В разработке" },
  { value: "inactive", label: "Не активен" },
  { value: "archived", label: "В архиве" },
];

const statusMeta: Record<DomainStatus, { label: string; color: string }> = {
  active:   { label: "Активен",       color: "var(--success)" },
  dev:      { label: "В разработке",  color: "var(--amber)" },
  inactive: { label: "Не активен",    color: "var(--text-dim)" },
  archived: { label: "В архиве",      color: "var(--steel)" },
};

const now = () => new Date().toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

const INITIAL: OrgDomain[] = [
  { id: "org-dom-001", name: "Банковский сегмент", owner: "А. Петров", status: "active", description: "Основной домен банковской инфраструктуры, включает АБС и процессинг.", version: 3, updatedAt: "06.06.2026 09:14" },
  { id: "org-dom-002", name: "ДМЗ периметр", owner: "И. Смирнова", status: "active", description: "Демилитаризованная зона: веб-серверы, WAF, балансировщики.", version: 2, updatedAt: "05.06.2026 17:22" },
  { id: "org-dom-003", name: "Офисная сеть", owner: "М. Козлов", status: "dev", description: "Сегмент рабочих станций и принтеров сотрудников.", version: 1, updatedAt: "04.06.2026 11:00" },
  { id: "org-dom-004", name: "Резервный ЦОД", owner: "В. Новиков", status: "inactive", description: "Резервная площадка для DR-процедур и учений.", version: 1, updatedAt: "01.06.2026 08:30" },
];

interface EditState {
  name: string;
  owner: string;
  status: DomainStatus;
  description: string;
}

export default function OrgDomains() {
  const [domains, setDomains] = useState<OrgDomain[]>(INITIAL);
  const [selected, setSelected] = useState<OrgDomain | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dirty, setDirty] = useState(false);

  const filtered = domains.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.id.includes(search.toLowerCase()) ||
      d.owner.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openCard = (domain: OrgDomain) => {
    setSelected(domain);
    setEdit({ name: domain.name, owner: domain.owner, status: domain.status, description: domain.description });
    setDirty(false);
  };

  const closeCard = () => {
    setSelected(null);
    setEdit(null);
    setDirty(false);
  };

  const handleChange = <K extends keyof EditState>(key: K, value: EditState[K]) => {
    setEdit(prev => prev ? { ...prev, [key]: value } : prev);
    setDirty(true);
  };

  const handleSave = () => {
    if (!selected || !edit) return;
    const updated: OrgDomain = {
      ...selected,
      name: edit.name,
      owner: edit.owner,
      status: edit.status,
      description: edit.description,
      version: selected.version + 1,
      updatedAt: now(),
    };
    setDomains(prev => prev.map(d => d.id === selected.id ? updated : d));
    setSelected(updated);
    setDirty(false);
  };

  const handleAdd = () => {
    const maxNum = domains.reduce((max, d) => {
      const num = parseInt(d.id.replace("org-dom-", ""), 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    const newDomain: OrgDomain = {
      id: `org-dom-${String(maxNum + 1).padStart(3, "0")}`,
      name: "Новый домен",
      owner: "",
      status: "dev",
      description: "",
      version: 1,
      updatedAt: now(),
    };
    setDomains(prev => [newDomain, ...prev]);
    openCard(newDomain);
  };

  const handleDelete = (id: string) => {
    setDomains(prev => prev.filter(d => d.id !== id));
    if (selected?.id === id) closeCard();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Организационные домены</h1>
          <p className="text-sm text-sec mt-0.5">{domains.length} доменов в реестре</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-amber text-primary-foreground text-sm font-medium rounded hover:opacity-90 transition-opacity"
        >
          <Icon name="Plus" size={16} />
          Добавить домен
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
          <input
            className="w-full pl-9 pr-3 py-2 bg-surface-1 border border-line rounded text-sm text-foreground placeholder:text-dim focus:outline-none focus:border-amber/50 transition-colors"
            placeholder="Поиск по ID, названию, владельцу..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 bg-surface-1 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50 transition-colors"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">Все статусы</option>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Status counters */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {STATUS_OPTIONS.map(o => (
          <div key={o.value} className="bg-surface-1 border border-line rounded p-3 flex items-center justify-between">
            <span className="text-xs text-sec">{o.label}</span>
            <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: statusMeta[o.value].color }}>
              <span className="status-dot" style={{ background: statusMeta[o.value].color }}></span>
              {domains.filter(d => d.status === o.value).length}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-4 flex-1 overflow-auto min-h-0">
        {/* Table */}
        <div className={`${selected ? "w-[480px] shrink-0" : "flex-1"} overflow-auto`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-36">ID</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider">Название</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider">Владелец</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-28">Статус</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-16">Версия</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-36">Обновлён</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr
                  key={d.id}
                  onClick={() => openCard(d)}
                  className={`border-b border-line/50 cursor-pointer transition-colors group animate-fade-in ${
                    selected?.id === d.id ? "bg-surface-2" : "hover:bg-surface-1"
                  }`}
                  style={{ animationDelay: `${i * 0.03}s`, opacity: 0 }}
                >
                  <td className="py-3 px-3">
                    <span className="font-mono text-xs text-steel">{d.id}</span>
                  </td>
                  <td className="py-3 px-3 font-medium text-foreground">{d.name}</td>
                  <td className="py-3 px-3 text-sec">{d.owner || <span className="text-dim italic">—</span>}</td>
                  <td className="py-3 px-3">
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: statusMeta[d.status].color }}>
                      <span className="status-dot" style={{ background: statusMeta[d.status].color }}></span>
                      {statusMeta[d.status].label}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="tag-info">v{d.version}</span>
                  </td>
                  <td className="py-3 px-3 text-dim text-xs font-mono">{d.updatedAt}</td>
                  <td className="py-3 px-3">
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(d.id); }}
                      className="opacity-0 group-hover:opacity-100 text-dim hover:text-danger transition-all"
                    >
                      <Icon name="Trash2" size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-dim text-sm">
                    <Icon name="SearchX" size={28} className="mx-auto mb-2 opacity-40" />
                    Домены не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Edit Card */}
        {selected && edit && (
          <div className="flex-1 bg-surface-1 border border-line rounded p-5 overflow-auto animate-fade-in min-w-[320px]">
            {/* Card header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-steel">{selected.id}</span>
                  <span className="tag-info">v{dirty ? selected.version : selected.version}</span>
                  {dirty && <span className="tag-medium">Несохранено</span>}
                </div>
                <p className="text-xs text-dim">Обновлён: {selected.updatedAt}</p>
              </div>
              <button onClick={closeCard} className="text-dim hover:text-foreground transition-colors">
                <Icon name="X" size={16} />
              </button>
            </div>

            {/* Fields */}
            <div className="space-y-4">
              {/* ID — не редактируемое */}
              <div>
                <label className="text-xs text-dim block mb-1.5 uppercase tracking-wider">ID</label>
                <div className="px-3 py-2 bg-surface-2 border border-line rounded text-sm font-mono text-dim select-all cursor-default">
                  {selected.id}
                </div>
              </div>

              {/* Название */}
              <div>
                <label className="text-xs text-dim block mb-1.5 uppercase tracking-wider">Название</label>
                <input
                  className="w-full px-3 py-2 bg-surface-2 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50 transition-colors"
                  value={edit.name}
                  onChange={e => handleChange("name", e.target.value)}
                  placeholder="Название домена"
                />
              </div>

              {/* Версия — только чтение, история */}
              <div>
                <label className="text-xs text-dim block mb-1.5 uppercase tracking-wider">Версия</label>
                <div className="flex items-center gap-3">
                  <div className="px-3 py-2 bg-surface-2 border border-line rounded text-sm font-mono text-steel cursor-default">
                    v{selected.version}{dirty ? <span className="text-amber"> → v{selected.version + 1}</span> : ""}
                  </div>
                  <p className="text-xs text-dim">Версия увеличивается автоматически при сохранении</p>
                </div>
              </div>

              {/* Владелец */}
              <div>
                <label className="text-xs text-dim block mb-1.5 uppercase tracking-wider">Владелец</label>
                <input
                  className="w-full px-3 py-2 bg-surface-2 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50 transition-colors"
                  value={edit.owner}
                  onChange={e => handleChange("owner", e.target.value)}
                  placeholder="ФИО или подразделение"
                />
              </div>

              {/* Статус */}
              <div>
                <label className="text-xs text-dim block mb-1.5 uppercase tracking-wider">Статус</label>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map(o => (
                    <button
                      key={o.value}
                      onClick={() => handleChange("status", o.value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded border text-sm transition-all ${
                        edit.status === o.value
                          ? "border-amber/50 bg-amber/10"
                          : "border-line bg-surface-2 hover:border-amber/20"
                      }`}
                    >
                      <span
                        className="status-dot shrink-0"
                        style={{ background: statusMeta[o.value].color }}
                      ></span>
                      <span
                        className={edit.status === o.value ? "text-amber font-medium" : "text-sec"}
                      >
                        {o.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Описание */}
              <div>
                <label className="text-xs text-dim block mb-1.5 uppercase tracking-wider">Описание</label>
                <textarea
                  className="w-full px-3 py-2 bg-surface-2 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50 transition-colors resize-none"
                  rows={4}
                  value={edit.description}
                  onChange={e => handleChange("description", e.target.value)}
                  placeholder="Описание организационного домена..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-5 pt-4 border-t border-line">
              <button
                onClick={handleSave}
                disabled={!dirty}
                className="flex-1 py-2 text-sm font-medium rounded transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed bg-amber text-primary-foreground hover:opacity-90"
              >
                <Icon name="Save" size={14} />
                Сохранить {dirty && `(v${selected.version + 1})`}
              </button>
              <button
                onClick={() => { setEdit({ name: selected.name, owner: selected.owner, status: selected.status, description: selected.description }); setDirty(false); }}
                disabled={!dirty}
                className="px-4 py-2 text-sm bg-surface-2 border border-line rounded text-sec hover:text-foreground hover:border-amber/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Сбросить
              </button>
              <button
                onClick={() => handleDelete(selected.id)}
                className="px-4 py-2 text-sm bg-surface-2 border border-line rounded text-dim hover:text-danger hover:border-danger/30 transition-colors"
              >
                <Icon name="Trash2" size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
