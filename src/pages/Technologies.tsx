import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import ConfirmDeleteDialog from "@/components/ui/confirm-delete-dialog";
import { technologiesApi, type Technology as TechItem } from "@/api/index";
import { userStore } from "@/data/userStore";

const STATUS_META: Record<string, { label: string; color: string }> = {
  active:   { label: "Активен",        color: "var(--success)" },
  dev:      { label: "В разработке",   color: "var(--amber)" },
  inactive: { label: "Не активен",     color: "var(--text-dim)" },
  archived: { label: "В архиве",       color: "var(--steel)" },
};

export default function Technologies() {
  const navigate = useNavigate();
  const isAdmin = userStore.get().role === "admin";

  const [items, setItems] = useState<TechItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await technologiesApi.list();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(t => {
    const q = search.toLowerCase();
    return (
      (t.name.toLowerCase().includes(q) || t.id.includes(q) || t.owner.toLowerCase().includes(q)) &&
      (statusFilter === "all" || t.status === statusFilter)
    );
  });

  const handleAdd = async () => {
    const { id } = await technologiesApi.create({ name: "Новая технология", status: "dev" });
    navigate(`/technologies/${id}`);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await technologiesApi.remove(deleteTarget.id);
    setDeleteTarget(null);
    load();
  };

  return (
    <div className="flex flex-col h-full">
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        title={deleteTarget?.name ?? ""}
        description="Технология будет удалена из реестра."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Технологии</h1>
          <p className="text-sm text-sec mt-0.5">{items.length} технологий в реестре</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-amber text-primary-foreground text-sm font-medium rounded hover:opacity-90 transition-opacity"
        >
          <Icon name="Plus" size={16} />
          Добавить технологию
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
          {Object.entries(STATUS_META).map(([v, m]) => (
            <option key={v} value={v}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {Object.entries(STATUS_META).map(([v, m]) => (
          <div key={v} className="bg-surface-1 border border-line rounded p-3 flex items-center justify-between">
            <span className="text-xs text-sec">{m.label}</span>
            <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: m.color }}>
              <span className="status-dot" style={{ background: m.color }} />
              {items.filter(t => t.status === v).length}
            </span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-dim">
            <Icon name="Loader" size={20} className="animate-spin mr-2" />
            Загрузка...
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-32">ID</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider">Название</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider">Владелец</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider">Теги</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-28">Статус</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-16">Версия</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-36">Обновлён</th>
                {isAdmin && <th className="w-10" />}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => {
                const meta = STATUS_META[t.status] ?? STATUS_META.inactive;
                const tags = Array.isArray(t.tags) ? t.tags.map((x: string | { tag: string }) => typeof x === "string" ? x : x.tag) : [];
                return (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`/technologies/${t.id}`)}
                    className="border-b border-line/50 cursor-pointer hover:bg-surface-1 transition-colors group animate-fade-in"
                    style={{ animationDelay: `${i * 0.03}s`, opacity: 0 }}
                  >
                    <td className="py-3 px-3 font-mono text-xs text-steel">{t.id}</td>
                    <td className="py-3 px-3 font-medium text-foreground">{t.name}</td>
                    <td className="py-3 px-3 text-sec">{t.owner || <span className="text-dim italic">—</span>}</td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {tags.slice(0, 3).map(tag => (
                          <span key={tag} className="tag-info">{tag}</span>
                        ))}
                        {tags.length > 3 && <span className="text-xs text-dim">+{tags.length - 3}</span>}
                        {tags.length === 0 && <span className="text-dim italic text-xs">—</span>}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="flex items-center gap-1.5 text-xs" style={{ color: meta.color }}>
                        <span className="status-dot" style={{ background: meta.color }} />
                        {meta.label}
                      </span>
                    </td>
                    <td className="py-3 px-3"><span className="tag-info">v{t.version}</span></td>
                    <td className="py-3 px-3 text-dim text-xs font-mono">
                      {new Date(t.updated_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-3">
                        <button
                          onClick={e => { e.stopPropagation(); setDeleteTarget({ id: t.id, name: t.name }); }}
                          className="opacity-0 group-hover:opacity-100 text-dim hover:text-danger transition-all"
                          title="Удалить"
                        >
                          <Icon name="Trash2" size={13} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-16 text-center text-dim text-sm">
                    <Icon name="SearchX" size={28} className="mx-auto mb-2 opacity-40" />
                    Технологии не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}