import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { orgDomainsStore, type DomainStatus } from "@/data/orgDomainsStore";

const STATUS_OPTIONS: { value: DomainStatus; label: string }[] = [
  { value: "active",   label: "Активен" },
  { value: "dev",      label: "В разработке" },
  { value: "inactive", label: "Не активен" },
  { value: "archived", label: "В архиве" },
];

const statusMeta: Record<DomainStatus, { label: string; color: string }> = {
  active:   { label: "Активен",      color: "var(--success)" },
  dev:      { label: "В разработке", color: "var(--amber)" },
  inactive: { label: "Не активен",   color: "var(--text-dim)" },
  archived: { label: "В архиве",     color: "var(--steel)" },
};

function useStore() {
  const [, tick] = useState(0);
  useState(() => { orgDomainsStore.sub(() => tick(n => n + 1)); });
  return orgDomainsStore.get();
}

// ────────────────────────────────────────────
// Список
// ────────────────────────────────────────────
export function OrgDomainsList() {
  const navigate = useNavigate();
  const domains = useStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = domains.filter(d => {
    const q = search.toLowerCase();
    return (
      (d.name.toLowerCase().includes(q) || d.id.includes(q) || d.owner.toLowerCase().includes(q)) &&
      (statusFilter === "all" || d.status === statusFilter)
    );
  });

  const handleAdd = () => {
    const newId = orgDomainsStore.add();
    navigate(`/orgdomains/${newId}`);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    orgDomainsStore.remove(id);
  };

  return (
    <div className="flex flex-col h-full">
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

      {/* Counters */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {STATUS_OPTIONS.map(o => (
          <div key={o.value} className="bg-surface-1 border border-line rounded p-3 flex items-center justify-between">
            <span className="text-xs text-sec">{o.label}</span>
            <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: statusMeta[o.value].color }}>
              <span className="status-dot" style={{ background: statusMeta[o.value].color }} />
              {domains.filter(d => d.status === o.value).length}
            </span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-36">ID</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider">Название</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider">Владелец</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-28">Статус</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-16">Версия</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-36">Обновлён</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((d, i) => (
              <tr
                key={d.id}
                onClick={() => navigate(`/orgdomains/${d.id}`)}
                className="border-b border-line/50 cursor-pointer hover:bg-surface-1 transition-colors group animate-fade-in"
                style={{ animationDelay: `${i * 0.03}s`, opacity: 0 }}
              >
                <td className="py-3 px-3 font-mono text-xs text-steel">{d.id}</td>
                <td className="py-3 px-3 font-medium text-foreground">{d.name}</td>
                <td className="py-3 px-3 text-sec">{d.owner || <span className="text-dim italic">—</span>}</td>
                <td className="py-3 px-3">
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: statusMeta[d.status].color }}>
                    <span className="status-dot" style={{ background: statusMeta[d.status].color }} />
                    {statusMeta[d.status].label}
                  </span>
                </td>
                <td className="py-3 px-3"><span className="tag-info">v{d.version}</span></td>
                <td className="py-3 px-3 text-dim text-xs font-mono">{d.updatedAt}</td>
                <td className="py-3 px-3">
                  <button
                    onClick={e => handleDelete(d.id, e)}
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
    </div>
  );
}

// ────────────────────────────────────────────
// Карточка редактирования
// ────────────────────────────────────────────
export function OrgDomainCard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const domains = useStore();
  const domain = domains.find(d => d.id === id);

  const [edit, setEdit] = useState(() =>
    domain
      ? { name: domain.name, owner: domain.owner, status: domain.status, description: domain.description }
      : null
  );
  const [dirty, setDirty] = useState(false);

  if (!domain || !edit) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-dim">
        <Icon name="AlertCircle" size={32} className="mb-3 opacity-40" />
        <p className="text-sm">Домен не найден</p>
        <button onClick={() => navigate("/orgdomains")} className="mt-4 text-xs text-steel hover:underline">
          ← Вернуться к списку
        </button>
      </div>
    );
  }

  const change = <K extends keyof typeof edit>(key: K, value: (typeof edit)[K]) => {
    setEdit(prev => prev ? { ...prev, [key]: value } : prev);
    setDirty(true);
  };

  const handleSave = () => {
    if (!edit) return;
    orgDomainsStore.save(domain.id, edit);
    setDirty(false);
  };

  const handleReset = () => {
    setEdit({ name: domain.name, owner: domain.owner, status: domain.status, description: domain.description });
    setDirty(false);
  };

  const handleDelete = () => {
    orgDomainsStore.remove(domain.id);
    navigate("/orgdomains");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6">
        <button
          onClick={() => navigate("/orgdomains")}
          className="text-sec hover:text-foreground transition-colors flex items-center gap-1"
        >
          <Icon name="ChevronLeft" size={14} />
          Организационные домены
        </button>
        <Icon name="ChevronRight" size={13} className="text-dim" />
        <span className="font-mono text-xs text-steel">{domain.id}</span>
        <span className="tag-info">v{domain.version}</span>
        {dirty && <span className="tag-medium">Несохранено</span>}
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl space-y-5">

          {/* ID */}
          <div>
            <label className="text-xs text-dim block mb-1.5 uppercase tracking-wider">ID</label>
            <div className="px-3 py-2 bg-surface-1 border border-line rounded text-sm font-mono text-dim select-all cursor-default">
              {domain.id}
            </div>
          </div>

          {/* Название */}
          <div>
            <label className="text-xs text-dim block mb-1.5 uppercase tracking-wider">Название</label>
            <input
              className="w-full px-3 py-2 bg-surface-1 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50 transition-colors"
              value={edit.name}
              onChange={e => change("name", e.target.value)}
              placeholder="Название организационного домена"
            />
          </div>

          {/* Версия */}
          <div>
            <label className="text-xs text-dim block mb-1.5 uppercase tracking-wider">Версия</label>
            <div className="flex items-center gap-3">
              <div className="px-3 py-2 bg-surface-1 border border-line rounded text-sm font-mono text-steel cursor-default">
                v{domain.version}{dirty && <span className="text-amber"> → v{domain.version + 1}</span>}
              </div>
              <p className="text-xs text-dim">Увеличивается автоматически при сохранении</p>
            </div>
          </div>

          {/* Владелец */}
          <div>
            <label className="text-xs text-dim block mb-1.5 uppercase tracking-wider">Владелец</label>
            <input
              className="w-full px-3 py-2 bg-surface-1 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50 transition-colors"
              value={edit.owner}
              onChange={e => change("owner", e.target.value)}
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
                  onClick={() => change("status", o.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded border text-sm transition-all ${
                    edit.status === o.value
                      ? "border-amber/50 bg-amber/10"
                      : "border-line bg-surface-1 hover:border-amber/20"
                  }`}
                >
                  <span className="status-dot shrink-0" style={{ background: statusMeta[o.value].color }} />
                  <span className={edit.status === o.value ? "text-amber font-medium" : "text-sec"}>
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
              className="w-full px-3 py-2 bg-surface-1 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50 transition-colors resize-none"
              rows={4}
              value={edit.description}
              onChange={e => change("description", e.target.value)}
              placeholder="Описание организационного домена..."
            />
          </div>

          {/* Meta */}
          <div className="text-xs text-dim pt-2 border-t border-line">
            Последнее обновление: <span className="font-mono">{domain.updatedAt}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pb-6">
            <button
              onClick={handleSave}
              disabled={!dirty}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium rounded bg-amber text-primary-foreground hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Icon name="Save" size={14} />
              Сохранить {dirty && `(v${domain.version + 1})`}
            </button>
            <button
              onClick={handleReset}
              disabled={!dirty}
              className="px-4 py-2 text-sm bg-surface-1 border border-line rounded text-sec hover:text-foreground hover:border-amber/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Сбросить
            </button>
            <button
              onClick={handleDelete}
              className="ml-auto px-4 py-2 text-sm bg-surface-1 border border-line rounded text-dim hover:text-danger hover:border-danger/30 transition-colors flex items-center gap-2"
            >
              <Icon name="Trash2" size={14} />
              Удалить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// default export для обратной совместимости
export default OrgDomainsList;
