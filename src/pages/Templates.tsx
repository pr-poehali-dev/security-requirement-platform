import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import ConfirmDeleteDialog from "@/components/ui/confirm-delete-dialog";
import { templatesApi, type Template } from "@/api/index";
import { userStore } from "@/data/userStore";

const complexityLabel = (c: string) => ({ high: "Сложный", medium: "Средний", low: "Базовый" }[c] || c);
const complexityClass = (c: string) => ({ high: "tag-critical", medium: "tag-medium", low: "tag-low" }[c] || "tag-info");

export default function Templates() {
  const isAdmin = userStore.get().role === "admin";
  const [items, setItems]     = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Template | null>(null);
  const [search, setSearch]   = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);
  const [applying, setApplying] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await templatesApi.list({ search });
    setItems(data);
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleApply = async (tpl: Template) => {
    setApplying(true);
    const res = await templatesApi.apply(tpl.id);
    setItems(prev => prev.map(t => t.id === tpl.id ? { ...t, used_count: res.used_count } : t));
    if (selected?.id === tpl.id) setSelected(prev => prev ? { ...prev, used_count: res.used_count } : prev);
    setApplying(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await templatesApi.remove(deleteTarget.id);
    if (selected?.id === deleteTarget.id) setSelected(null);
    setDeleteTarget(null);
    load();
  };

  const filtered = items.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        title={deleteTarget?.title ?? ""}
        description="Шаблон будет удалён из реестра."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Шаблоны</h1>
          <p className="text-sm text-sec mt-0.5">Готовые наборы требований по отраслям</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-amber text-primary-foreground text-sm font-medium rounded hover:opacity-90 transition-opacity">
          <Icon name="Plus" size={16} /> Создать шаблон
        </button>
      </div>

      <div className="relative mb-5 max-w-sm">
        <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
        <input className="w-full pl-9 pr-3 py-2 bg-surface-1 border border-line rounded text-sm text-foreground placeholder:text-dim focus:outline-none focus:border-amber/50"
          placeholder="Поиск шаблонов..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-dim"><Icon name="Loader" size={20} className="animate-spin mr-2" /> Загрузка...</div>
      ) : (
        <div className="flex gap-5 flex-1 overflow-auto">
          <div className={`${selected ? "w-[480px] shrink-0" : "w-full"} grid ${selected ? "grid-cols-1" : "grid-cols-2 xl:grid-cols-3"} gap-4 content-start overflow-auto`}>
            {filtered.map((tpl, i) => (
              <div key={tpl.id} onClick={() => setSelected(selected?.id === tpl.id ? null : tpl)}
                className={`bg-surface-1 border rounded p-5 cursor-pointer transition-all group animate-fade-in relative ${selected?.id === tpl.id ? "border-amber/50 glow-amber" : "border-line hover:border-amber/30"}`}
                style={{ animationDelay: `${i * 0.06}s`, opacity: 0 }}>
                {isAdmin && (
                  <button onClick={e => { e.stopPropagation(); setDeleteTarget(tpl); }}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-dim hover:text-danger transition-all z-10">
                    <Icon name="Trash2" size={13} />
                  </button>
                )}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded bg-surface-2 border border-line flex items-center justify-center shrink-0">
                    <Icon name={tpl.icon as "Building2"} size={18} className="text-amber" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="font-semibold text-sm text-foreground truncate">{tpl.title}</span>
                      <span className={complexityClass(tpl.complexity)}>{complexityLabel(tpl.complexity)}</span>
                    </div>
                    <span className="text-xs text-dim">{tpl.category}</span>
                  </div>
                </div>
                <p className="text-xs text-sec leading-relaxed mb-3">{tpl.description}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {tpl.compliance.map(c => <span key={c.id} className="tag-info">{c.standard_name}</span>)}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-line/50">
                  <span className="text-xs text-dim">{tpl.compliance.length} стандартов</span>
                  <span className="text-xs text-dim flex items-center gap-1">
                    <Icon name="Users" size={11} /> Использован {tpl.used_count} раз
                  </span>
                </div>
              </div>
            ))}
          </div>

          {selected && (
            <div className="flex-1 bg-surface-1 border border-line rounded p-5 overflow-auto animate-fade-in">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-surface-2 border border-amber/30 flex items-center justify-center">
                    <Icon name={selected.icon as "Building2"} size={20} className="text-amber" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">{selected.title}</h2>
                    <span className="text-xs text-dim">{selected.category} · {selected.id}</span>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="text-dim hover:text-foreground transition-colors">
                  <Icon name="X" size={16} />
                </button>
              </div>

              <p className="text-sm text-sec mb-5 pb-5 border-b border-line">{selected.description}</p>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-surface-2 rounded p-3">
                  <span className="text-xs text-dim block mb-1">Сложность</span>
                  <span className={complexityClass(selected.complexity)}>{complexityLabel(selected.complexity)}</span>
                </div>
                <div className="bg-surface-2 rounded p-3">
                  <span className="text-xs text-dim block mb-1">Использован</span>
                  <span className="text-2xl font-semibold text-amber">{selected.used_count}</span>
                </div>
              </div>

              <div className="mb-5">
                <p className="text-xs text-dim uppercase tracking-wider mb-2">Регуляторные стандарты</p>
                <div className="flex flex-col gap-1.5">
                  {selected.compliance.map(c => (
                    <div key={c.id} className="flex items-center gap-2 bg-surface-2 rounded px-3 py-2">
                      <Icon name="CheckCircle" size={13} className="text-success" />
                      <span className="text-sm text-foreground font-mono">{c.standard_name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => handleApply(selected)} disabled={applying}
                  className="flex-1 py-2 text-xs bg-amber text-primary-foreground rounded font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60">
                  <Icon name="GitBranch" size={13} />
                  {applying ? "Применение..." : "Применить к архитектуре"}
                </button>
                {isAdmin && (
                  <button onClick={() => setDeleteTarget(selected)}
                    className="px-4 py-2 text-xs bg-surface-2 border border-line rounded text-dim hover:text-danger hover:border-danger/30 transition-colors flex items-center gap-1.5">
                    <Icon name="Trash2" size={13} /> Удалить
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
