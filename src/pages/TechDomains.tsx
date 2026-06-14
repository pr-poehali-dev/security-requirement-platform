import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import ConfirmDeleteDialog from "@/components/ui/confirm-delete-dialog";
import { techDomainsApi, orgDomainsApi, type TechDomain, type OrgDomain } from "@/api/index";
import { userStore } from "@/data/userStore";

type TechStatus = "active" | "dev" | "inactive" | "archived";

const STATUS_OPTIONS: { value: TechStatus; label: string }[] = [
  { value: "active",   label: "Активен" },
  { value: "dev",      label: "В разработке" },
  { value: "inactive", label: "Не активен" },
  { value: "archived", label: "В архиве" },
];

const statusMeta: Record<TechStatus, { label: string; color: string }> = {
  active:   { label: "Активен",      color: "var(--success)" },
  dev:      { label: "В разработке", color: "var(--amber)" },
  inactive: { label: "Не активен",   color: "var(--text-dim)" },
  archived: { label: "В архиве",     color: "var(--steel)" },
};

const fmtDate = (s: string) => new Date(s).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

// ── Список ───────────────────────────────────────────────────────────────────
export function TechDomainsList() {
  const navigate = useNavigate();
  const isAdmin = userStore.get().role === "admin";
  const [items, setItems]       = useState<TechDomain[]>([]);
  const [orgDomains, setOrgDomains] = useState<OrgDomain[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<TechDomain | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [data, orgs] = await Promise.all([techDomainsApi.list(), orgDomainsApi.list()]);
    setItems(data);
    setOrgDomains(orgs);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(d => {
    const q = search.toLowerCase();
    return (
      (d.name.toLowerCase().includes(q) || d.id.includes(q) || d.owner.toLowerCase().includes(q)) &&
      (statusFilter === "all" || d.status === statusFilter)
    );
  });

  const getOrgName = (id: string) => orgDomains.find(o => o.id === id)?.name ?? id;

  const handleAdd = async () => {
    const created = await techDomainsApi.create({ name: "Новый технический домен", status: "dev" });
    navigate(`/techdomains/${created.id}`);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await techDomainsApi.remove(deleteTarget.id);
    setDeleteTarget(null);
    load();
  };

  return (
    <div className="flex flex-col h-full">
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        title={deleteTarget?.name ?? ""}
        description="Технический домен будет удалён из реестра."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Технические домены</h1>
          <p className="text-sm text-sec mt-0.5">{items.length} доменов в реестре</p>
        </div>
        <button onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-amber text-primary-foreground text-sm font-medium rounded hover:opacity-90 transition-opacity">
          <Icon name="Plus" size={16} /> Добавить домен
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
          <input className="w-full pl-9 pr-3 py-2 bg-surface-1 border border-line rounded text-sm text-foreground placeholder:text-dim focus:outline-none focus:border-amber/50"
            placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="px-3 py-2 bg-surface-1 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50"
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">Все статусы</option>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        {STATUS_OPTIONS.map(o => (
          <div key={o.value} className="bg-surface-1 border border-line rounded p-3 flex items-center justify-between">
            <span className="text-xs text-sec">{o.label}</span>
            <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: statusMeta[o.value].color }}>
              <span className="status-dot" style={{ background: statusMeta[o.value].color }} />
              {items.filter(d => d.status === o.value).length}
            </span>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-dim"><Icon name="Loader" size={20} className="animate-spin mr-2" /> Загрузка...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-36">ID</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider">Название</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider">Владелец</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-28">Статус</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-16">Версия</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider">Орг. домены</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-36">Обновлён</th>
                {isAdmin && <th className="w-10" />}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr key={d.id} onClick={() => navigate(`/techdomains/${d.id}`)}
                  className="border-b border-line/50 cursor-pointer hover:bg-surface-1 transition-colors group animate-fade-in"
                  style={{ animationDelay: `${i * 0.03}s`, opacity: 0 }}>
                  <td className="py-3 px-3 font-mono text-xs text-steel">{d.id}</td>
                  <td className="py-3 px-3 font-medium text-foreground">{d.name}</td>
                  <td className="py-3 px-3 text-sec">{d.owner || <span className="text-dim italic">—</span>}</td>
                  <td className="py-3 px-3">
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: statusMeta[d.status as TechStatus]?.color }}>
                      <span className="status-dot" style={{ background: statusMeta[d.status as TechStatus]?.color }} />
                      {statusMeta[d.status as TechStatus]?.label}
                    </span>
                  </td>
                  <td className="py-3 px-3"><span className="tag-info">v{d.version}</span></td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1">
                      {d.org_links.length === 0 ? <span className="text-dim italic text-xs">—</span>
                        : d.org_links.map(l => <span key={l.id} className="tag-info text-xs">{getOrgName(l.org_domain_id)}</span>)}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-dim text-xs font-mono">{fmtDate(d.updated_at)}</td>
                  {isAdmin && (
                    <td className="py-3 px-3">
                      <button onClick={e => { e.stopPropagation(); setDeleteTarget(d); }}
                        className="opacity-0 group-hover:opacity-100 text-dim hover:text-danger transition-all" title="Удалить">
                        <Icon name="Trash2" size={13} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={isAdmin ? 8 : 7} className="py-16 text-center text-dim text-sm">
                  <Icon name="SearchX" size={28} className="mx-auto mb-2 opacity-40" /> Домены не найдены
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Карточка ─────────────────────────────────────────────────────────────────
export function TechDomainCard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isAdmin = userStore.get().role === "admin";

  const [domain, setDomain]   = useState<TechDomain | null>(null);
  const [orgDomains, setOrgDomains] = useState<OrgDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit]       = useState({ name: "", owner: "", status: "dev", description: "" });
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]);
  const [dirty, setDirty]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [data, orgs] = await Promise.all([techDomainsApi.get(id), orgDomainsApi.list()]);
    setDomain(data);
    setOrgDomains(orgs);
    setEdit({ name: data.name, owner: data.owner, status: data.status, description: data.description });
    setSelectedOrgIds(data.org_links.map(l => l.org_domain_id));
    setDirty(false);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!id || !dirty) return;
    setSaving(true);
    const updated = await techDomainsApi.update(id, { ...edit, org_domain_ids: selectedOrgIds });
    setDomain(updated);
    setSaving(false);
    setDirty(false);
  };

  const confirmDelete = async () => {
    if (!id) return;
    await techDomainsApi.remove(id);
    navigate("/techdomains");
  };

  const change = (k: string, v: string) => { setEdit(p => ({ ...p, [k]: v })); setDirty(true); };
  const toggleOrg = (oid: string) => {
    setSelectedOrgIds(p => p.includes(oid) ? p.filter(x => x !== oid) : [...p, oid]);
    setDirty(true);
  };

  if (loading) return <div className="flex items-center justify-center h-full text-dim"><Icon name="Loader" size={24} className="animate-spin mr-2" /> Загрузка...</div>;
  if (!domain) return (
    <div className="flex flex-col items-center justify-center h-full text-dim">
      <Icon name="AlertCircle" size={32} className="mb-3 opacity-40" />
      <p className="text-sm">Домен не найден</p>
      <button onClick={() => navigate("/techdomains")} className="mt-4 text-xs text-steel hover:underline">← Вернуться к списку</button>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <ConfirmDeleteDialog
        open={deleteOpen}
        title={domain.name}
        description="Технический домен будет удалён из реестра."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      <div className="flex items-center gap-2 text-sm mb-6">
        <button onClick={() => navigate("/techdomains")} className="text-sec hover:text-foreground transition-colors flex items-center gap-1">
          <Icon name="ChevronLeft" size={14} /> Технические домены
        </button>
        <Icon name="ChevronRight" size={13} className="text-dim" />
        <span className="font-mono text-xs text-steel">{domain.id}</span>
        <span className="tag-info">v{domain.version}</span>
        {dirty && <span className="tag-medium">Несохранено</span>}
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl space-y-5">
          <div>
            <label className="text-xs text-dim block mb-1.5 uppercase tracking-wider">ID</label>
            <div className="px-3 py-2 bg-surface-1 border border-line rounded text-sm font-mono text-dim">{domain.id}</div>
          </div>
          {[["name","Название"],["owner","Владелец"]].map(([k, label]) => (
            <div key={k}>
              <label className="text-xs text-dim block mb-1.5 uppercase tracking-wider">{label}</label>
              <input className="w-full px-3 py-2 bg-surface-1 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50"
                value={edit[k as keyof typeof edit]} onChange={e => change(k, e.target.value)} />
            </div>
          ))}
          <div>
            <label className="text-xs text-dim block mb-1.5 uppercase tracking-wider">Статус</label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map(o => (
                <button key={o.value} onClick={() => change("status", o.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded border text-sm transition-all ${edit.status === o.value ? "border-amber/50 bg-amber/10" : "border-line bg-surface-1 hover:border-amber/20"}`}>
                  <span className="status-dot shrink-0" style={{ background: statusMeta[o.value].color }} />
                  <span className={edit.status === o.value ? "text-amber font-medium" : "text-sec"}>{o.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-dim block mb-1.5 uppercase tracking-wider">Описание</label>
            <textarea className="w-full px-3 py-2 bg-surface-1 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50 resize-none"
              rows={3} value={edit.description} onChange={e => change("description", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-dim block mb-1.5 uppercase tracking-wider">Организационные домены</label>
            <div className="grid grid-cols-2 gap-2">
              {orgDomains.map(o => (
                <button key={o.id} onClick={() => toggleOrg(o.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded border text-sm text-left transition-all ${selectedOrgIds.includes(o.id) ? "border-amber/50 bg-amber/10 text-amber" : "border-line bg-surface-1 text-sec hover:border-amber/20"}`}>
                  <Icon name={selectedOrgIds.includes(o.id) ? "CheckSquare" : "Square"} size={13} />
                  <span className="truncate">{o.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="text-xs text-dim pt-2 border-t border-line">
            Последнее обновление: <span className="font-mono">{fmtDate(domain.updated_at)}</span>
          </div>
          <div className="flex gap-2 pb-6">
            <button onClick={handleSave} disabled={!dirty || saving}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium rounded bg-amber text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
              <Icon name="Save" size={14} />
              {saving ? "Сохранение..." : `Сохранить${dirty ? ` (v${domain.version + 1})` : ""}`}
            </button>
            <button onClick={() => { setEdit({ name: domain.name, owner: domain.owner, status: domain.status, description: domain.description }); setSelectedOrgIds(domain.org_links.map(l => l.org_domain_id)); setDirty(false); }}
              disabled={!dirty} className="px-4 py-2 text-sm bg-surface-1 border border-line rounded text-sec hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed">
              Сбросить
            </button>
            {isAdmin ? (
              <button onClick={() => setDeleteOpen(true)}
                className="ml-auto px-4 py-2 text-sm bg-surface-1 border border-line rounded text-dim hover:text-danger hover:border-danger/30 transition-colors flex items-center gap-2">
                <Icon name="Trash2" size={14} /> Удалить
              </button>
            ) : (
              <div className="ml-auto flex items-center gap-1.5 text-xs text-dim px-3">
                <Icon name="Lock" size={12} /> Удаление доступно только администратору
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TechDomainsList;
