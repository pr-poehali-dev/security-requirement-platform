import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import ConfirmDeleteDialog from "@/components/ui/confirm-delete-dialog";
import { architecturesApi, type Architecture } from "@/api/index";
import { userStore } from "@/data/userStore";

const statusLabel = (s: string) => ({ approved: "Утверждена", review: "На проверке", draft: "Черновик" }[s] || s);
const statusColor = (s: string) => ({ approved: "var(--success)", review: "var(--amber)", draft: "var(--text-dim)" }[s] || "var(--text-dim)");

export default function Architectures() {
  const isAdmin = userStore.get().role === "admin";
  const [items, setItems]     = useState<Architecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Architecture | null>(null);
  const [view, setView]       = useState<"grid" | "list">("grid");
  const [deleteTarget, setDeleteTarget] = useState<Architecture | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", category: "", status: "", author: "", tags: "" });
  const [dirty, setDirty]     = useState(false);
  const [saving, setSaving]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await architecturesApi.list();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openDetail = (a: Architecture) => {
    setSelected(a);
    setEditForm({ title: a.title, description: a.description, category: a.category, status: a.status, author: a.author, tags: a.tags.map(t => t.tag).join(", ") });
    setDirty(false);
  };

  const handleAdd = async () => {
    const created = await architecturesApi.create({ title: "Новая архитектура", status: "draft" });
    await load();
    openDetail(created);
  };

  const handleSave = async () => {
    if (!selected || !dirty) return;
    setSaving(true);
    const tagsArr = editForm.tags.split(",").map(t => t.trim()).filter(Boolean);
    const updated = await architecturesApi.update(selected.id, { ...editForm, tags: tagsArr });
    setSelected(updated);
    setSaving(false);
    setDirty(false);
    load();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await architecturesApi.remove(deleteTarget.id);
    if (selected?.id === deleteTarget.id) setSelected(null);
    setDeleteTarget(null);
    load();
  };

  const changeForm = (k: string, v: string) => { setEditForm(p => ({ ...p, [k]: v })); setDirty(true); };

  return (
    <div className="flex flex-col h-full">
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        title={deleteTarget?.title ?? ""}
        description="Архитектура будет удалена из реестра."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Архитектуры</h1>
          <p className="text-sm text-sec mt-0.5">{items.length} типовых архитектур</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-surface-1 border border-line rounded overflow-hidden">
            <button onClick={() => setView("grid")} className={`p-2 transition-colors ${view === "grid" ? "bg-surface-2 text-amber" : "text-dim hover:text-foreground"}`}>
              <Icon name="LayoutGrid" size={15} />
            </button>
            <button onClick={() => setView("list")} className={`p-2 transition-colors ${view === "list" ? "bg-surface-2 text-amber" : "text-dim hover:text-foreground"}`}>
              <Icon name="List" size={15} />
            </button>
          </div>
          <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-amber text-primary-foreground text-sm font-medium rounded hover:opacity-90 transition-opacity">
            <Icon name="Plus" size={16} /> Новая архитектура
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-dim"><Icon name="Loader" size={20} className="animate-spin mr-2" /> Загрузка...</div>
      ) : (
        <div className={`flex gap-4 flex-1 overflow-hidden`}>
          <div className={`${selected ? "w-[420px] shrink-0" : "w-full"} overflow-auto`}>
            {view === "grid" && !selected ? (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                {items.map((arch, i) => (
                  <div key={arch.id} onClick={() => openDetail(arch)}
                    className="bg-surface-1 border border-line rounded p-4 cursor-pointer hover:border-amber/40 transition-all group animate-fade-in relative"
                    style={{ animationDelay: `${i * 0.06}s`, opacity: 0 }}>
                    {isAdmin && (
                      <button onClick={e => { e.stopPropagation(); setDeleteTarget(arch); }}
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-dim hover:text-danger transition-all z-10">
                        <Icon name="Trash2" size={13} />
                      </button>
                    )}
                    <div className="flex items-start justify-between mb-3">
                      <span className="font-mono text-xs text-steel">{arch.id}</span>
                      <span className="flex items-center gap-1 text-xs mr-5" style={{ color: statusColor(arch.status) }}>
                        <span className="status-dot" style={{ background: statusColor(arch.status) }} />
                        {statusLabel(arch.status)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground text-sm mb-2 group-hover:text-amber transition-colors">{arch.title}</h3>
                    <p className="text-xs text-sec leading-relaxed mb-3 line-clamp-2">{arch.description}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {arch.tags.slice(0, 3).map(t => <span key={t.id} className="tag-info">{t.tag}</span>)}
                    </div>
                    <div className="flex items-center justify-between text-xs text-dim pt-2 border-t border-line/50">
                      <span>{arch.req_links.length} требований</span>
                      <span>{arch.author}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-24">ID</th>
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider">Название</th>
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider">Категория</th>
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-28">Статус</th>
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-28">Обновлена</th>
                    {isAdmin && <th className="w-10" />}
                  </tr>
                </thead>
                <tbody>
                  {items.map((arch, i) => (
                    <tr key={arch.id} onClick={() => openDetail(arch)}
                      className={`border-b border-line/50 cursor-pointer transition-colors group animate-fade-in ${selected?.id === arch.id ? "bg-surface-2" : "hover:bg-surface-1"}`}
                      style={{ animationDelay: `${i * 0.04}s`, opacity: 0 }}>
                      <td className="py-3 px-3 font-mono text-xs text-steel">{arch.id}</td>
                      <td className="py-3 px-3 font-medium text-foreground">{arch.title}</td>
                      <td className="py-3 px-3 text-sec">{arch.category}</td>
                      <td className="py-3 px-3">
                        <span className="flex items-center gap-1.5 text-xs" style={{ color: statusColor(arch.status) }}>
                          <span className="status-dot" style={{ background: statusColor(arch.status) }} />
                          {statusLabel(arch.status)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-dim text-xs">{new Date(arch.updated_at).toLocaleDateString("ru-RU")}</td>
                      {isAdmin && (
                        <td className="py-3 px-3">
                          <button onClick={e => { e.stopPropagation(); setDeleteTarget(arch); }}
                            className="opacity-0 group-hover:opacity-100 text-dim hover:text-danger transition-all">
                            <Icon name="Trash2" size={13} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="flex-1 bg-surface-1 border border-line rounded p-5 overflow-auto animate-fade-in">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="font-mono text-xs text-steel">{selected.id}</span>
                  <span className="ml-2 tag-info">v{selected.version}</span>
                  {dirty && <span className="ml-2 tag-medium">Несохранено</span>}
                </div>
                <button onClick={() => setSelected(null)} className="text-dim hover:text-foreground transition-colors">
                  <Icon name="X" size={16} />
                </button>
              </div>

              <div className="space-y-4">
                {[["title","Название"],["description","Описание"],["category","Категория"],["author","Автор"]].map(([k, label]) => (
                  <div key={k}>
                    <label className="text-xs text-dim block mb-1 uppercase tracking-wider">{label}</label>
                    {k === "description" ? (
                      <textarea className="w-full px-3 py-2 bg-surface-2 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50 resize-none"
                        rows={3} value={editForm[k as keyof typeof editForm]} onChange={e => changeForm(k, e.target.value)} />
                    ) : (
                      <input className="w-full px-3 py-2 bg-surface-2 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50"
                        value={editForm[k as keyof typeof editForm]} onChange={e => changeForm(k, e.target.value)} />
                    )}
                  </div>
                ))}
                <div>
                  <label className="text-xs text-dim block mb-1 uppercase tracking-wider">Статус</label>
                  <select className="w-full px-3 py-2 bg-surface-2 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50"
                    value={editForm.status} onChange={e => changeForm("status", e.target.value)}>
                    {["approved","review","draft"].map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-dim block mb-1 uppercase tracking-wider">Теги (через запятую)</label>
                  <input className="w-full px-3 py-2 bg-surface-2 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50"
                    value={editForm.tags} onChange={e => changeForm("tags", e.target.value)} />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {editForm.tags.split(",").map(t => t.trim()).filter(Boolean).map(t => (
                      <span key={t} className="tag-info">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={!dirty || saving}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded bg-amber text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
                    <Icon name="Save" size={14} />
                    {saving ? "Сохранение..." : "Сохранить"}
                  </button>
                  {isAdmin && (
                    <button onClick={() => setDeleteTarget(selected)}
                      className="ml-auto px-4 py-2 text-sm bg-surface-2 border border-line rounded text-dim hover:text-danger hover:border-danger/30 transition-colors flex items-center gap-2">
                      <Icon name="Trash2" size={14} /> Удалить
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
