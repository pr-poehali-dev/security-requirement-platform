import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import ConfirmDeleteDialog from "@/components/ui/confirm-delete-dialog";
import { requirementsApi, type Requirement } from "@/api/index";
import { userStore } from "@/data/userStore";

const CATEGORIES = ["Все", "Идентификация и аутентификация", "Защита данных", "Управление доступом",
  "Мониторинг и аудит", "Сетевая безопасность", "Безопасность ПО", "Непрерывность бизнеса", "Защита конечных точек"];
const SEVERITIES = ["Все", "critical", "high", "medium", "low"];

const severityLabel = (s: string) => ({ critical: "Критический", high: "Высокий", medium: "Средний", low: "Низкий" }[s] || s);
const statusLabel   = (s: string) => ({ active: "Активен", draft: "Черновик", review: "На проверке", archived: "Архив" }[s] || s);
const statusColor   = (s: string) => ({ active: "var(--success)", draft: "var(--text-dim)", review: "var(--amber)", archived: "var(--text-dim)" }[s] || "var(--text-dim)");

export default function Requirements() {
  const isAdmin = userStore.get().role === "admin";
  const [items, setItems]           = useState<Requirement[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [catFilter, setCatFilter]   = useState("Все");
  const [sevFilter, setSevFilter]   = useState("Все");
  const [selected, setSelected]     = useState<Requirement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Requirement | null>(null);

  // Боковая панель редактирования
  const [editForm, setEditForm] = useState({ title: "", description: "", category: "", severity: "", status: "", source: "" });
  const [dirty, setDirty]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const [commentText, setCommentText] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (catFilter !== "Все") params.category = catFilter;
    if (sevFilter !== "Все") params.severity = sevFilter;
    if (search)              params.search   = search;
    const data = await requirementsApi.list(params);
    setItems(data);
    setLoading(false);
  }, [search, catFilter, sevFilter]);

  useEffect(() => { load(); }, [load]);

  const openDetail = (req: Requirement) => {
    setSelected(req);
    setEditForm({ title: req.title, description: req.description, category: req.category, severity: req.severity, status: req.status, source: req.source });
    setDirty(false);
  };

  const handleSave = async () => {
    if (!selected || !dirty) return;
    setSaving(true);
    const updated = await requirementsApi.update(selected.id, editForm);
    setSelected(updated);
    setSaving(false);
    setDirty(false);
    load();
  };

  const handleAdd = async () => {
    const created = await requirementsApi.create({ title: "Новое требование", severity: "medium", status: "draft" });
    await load();
    openDetail(created);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await requirementsApi.remove(deleteTarget.id);
    if (selected?.id === deleteTarget.id) setSelected(null);
    setDeleteTarget(null);
    load();
  };

  const addComment = async () => {
    if (!selected || !commentText.trim()) return;
    await requirementsApi.addComment(selected.id, commentText.trim());
    setCommentText("");
    const updated = await requirementsApi.get(selected.id);
    setSelected(updated);
  };

  const changeForm = (k: string, v: string) => { setEditForm(p => ({ ...p, [k]: v })); setDirty(true); };

  return (
    <div className="flex flex-col h-full">
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        title={deleteTarget?.title ?? ""}
        description="Требование будет удалено из реестра."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Требования ИБ</h1>
          <p className="text-sm text-sec mt-0.5">{items.length} требований в реестре</p>
        </div>
        <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-amber text-primary-foreground text-sm font-medium rounded hover:opacity-90 transition-opacity">
          <Icon name="Plus" size={16} /> Добавить требование
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
          <input className="w-full pl-9 pr-3 py-2 bg-surface-1 border border-line rounded text-sm text-foreground placeholder:text-dim focus:outline-none focus:border-amber/50"
            placeholder="Поиск по ID или названию..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="px-3 py-2 bg-surface-1 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50"
          value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="px-3 py-2 bg-surface-1 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50"
          value={sevFilter} onChange={e => setSevFilter(e.target.value)}>
          {SEVERITIES.map(s => <option key={s} value={s}>{s === "Все" ? "Все приоритеты" : severityLabel(s)}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[["critical","Критических","tag-critical"],["high","Высоких","tag-high"],["medium","Средних","tag-medium"],["low","Низких","tag-low"]].map(([sev,label,cls]) => (
          <div key={sev} className="bg-surface-1 border border-line rounded p-3 flex items-center justify-between">
            <span className="text-xs text-sec">{label}</span>
            <span className={cls}>{items.filter(r => r.severity === sev).length}</span>
          </div>
        ))}
      </div>

      <div className={`flex gap-4 flex-1 overflow-hidden`}>
        {/* Table */}
        <div className={`${selected ? "w-[55%]" : "w-full"} overflow-auto`}>
          {loading ? (
            <div className="flex items-center justify-center py-20 text-dim">
              <Icon name="Loader" size={20} className="animate-spin mr-2" /> Загрузка...
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-24">ID</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider">Требование</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-28">Приоритет</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-28">Статус</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-28">Источник</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {items.map((req, i) => (
                  <tr key={req.id}
                    className={`border-b border-line/50 cursor-pointer transition-colors group animate-fade-in ${selected?.id === req.id ? "bg-surface-2" : "hover:bg-surface-1"}`}
                    style={{ animationDelay: `${i * 0.03}s`, opacity: 0 }}
                    onClick={() => openDetail(req)}
                  >
                    <td className="py-3 px-3 font-mono text-xs text-steel">{req.id}</td>
                    <td className="py-3 px-3 font-medium text-foreground">{req.title}</td>
                    <td className="py-3 px-3"><span className={`tag-${req.severity}`}>{severityLabel(req.severity)}</span></td>
                    <td className="py-3 px-3">
                      <span className="flex items-center gap-1.5 text-xs" style={{ color: statusColor(req.status) }}>
                        <span className="status-dot" style={{ background: statusColor(req.status) }} />
                        {statusLabel(req.status)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-sec font-mono text-xs">{req.source}</td>
                    <td className="py-3 px-3">
                      {isAdmin ? (
                        <button onClick={e => { e.stopPropagation(); setDeleteTarget(req); }}
                          className="opacity-0 group-hover:opacity-100 text-dim hover:text-danger transition-all">
                          <Icon name="Trash2" size={13} />
                        </button>
                      ) : (
                        <Icon name="ChevronRight" size={14} className="text-dim opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-dim">
              <Icon name="SearchX" size={32} className="mb-3 opacity-40" />
              <p className="text-sm">Требования не найдены</p>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="flex-1 bg-surface-1 border border-line rounded p-5 overflow-auto animate-fade-in">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="font-mono text-xs text-steel">{selected.id}</span>
                <span className="ml-2 tag-info">v{selected.version}</span>
              </div>
              <button onClick={() => setSelected(null)} className="text-dim hover:text-foreground transition-colors">
                <Icon name="X" size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-dim block mb-1 uppercase tracking-wider">Название</label>
                <input className="w-full px-3 py-2 bg-surface-2 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50"
                  value={editForm.title} onChange={e => changeForm("title", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-dim block mb-1 uppercase tracking-wider">Приоритет</label>
                  <select className="w-full px-3 py-2 bg-surface-2 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50"
                    value={editForm.severity} onChange={e => changeForm("severity", e.target.value)}>
                    {["critical","high","medium","low"].map(s => <option key={s} value={s}>{severityLabel(s)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-dim block mb-1 uppercase tracking-wider">Статус</label>
                  <select className="w-full px-3 py-2 bg-surface-2 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50"
                    value={editForm.status} onChange={e => changeForm("status", e.target.value)}>
                    {["active","draft","review","archived"].map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-dim block mb-1 uppercase tracking-wider">Источник</label>
                <input className="w-full px-3 py-2 bg-surface-2 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50"
                  value={editForm.source} onChange={e => changeForm("source", e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-dim block mb-1 uppercase tracking-wider">Описание</label>
                <textarea className="w-full px-3 py-2 bg-surface-2 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50 resize-none"
                  rows={4} value={editForm.description} onChange={e => changeForm("description", e.target.value)} />
              </div>

              <div className="flex gap-2">
                <button onClick={handleSave} disabled={!dirty || saving}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded bg-amber text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
                  <Icon name="Save" size={14} />
                  {saving ? "Сохранение..." : `Сохранить${dirty ? ` (v${selected.version + 1})` : ""}`}
                </button>
                <button onClick={() => { setEditForm({ title: selected.title, description: selected.description, category: selected.category, severity: selected.severity, status: selected.status, source: selected.source }); setDirty(false); }}
                  disabled={!dirty}
                  className="px-4 py-2 text-sm bg-surface-2 border border-line rounded text-sec hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed">
                  Сбросить
                </button>
              </div>

              {/* Comments */}
              {selected.comments.length > 0 && (
                <div className="pt-3 border-t border-line">
                  <p className="text-xs text-dim uppercase tracking-wider mb-2">Комментарии</p>
                  {selected.comments.map(c => (
                    <div key={c.id} className="bg-surface-2 rounded px-3 py-2 mb-2 text-xs text-sec">
                      <span className="text-dim mr-2">{new Date(c.created_at).toLocaleString("ru-RU")}</span>
                      {c.text}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <input className="flex-1 px-3 py-2 bg-surface-2 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50"
                  placeholder="Добавить комментарий..." value={commentText} onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") addComment(); }} />
                <button onClick={addComment} className="px-3 py-2 bg-surface-2 border border-line rounded text-sec hover:text-amber transition-colors">
                  <Icon name="Send" size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
