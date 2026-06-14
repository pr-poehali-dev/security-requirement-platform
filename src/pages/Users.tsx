import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import ConfirmDeleteDialog from "@/components/ui/confirm-delete-dialog";
import { usersApi, type User } from "@/api/index";
import { userStore } from "@/data/userStore";

const roleLabel   = (r: string) => ({ admin: "Администратор", architect: "Архитектор", analyst: "Аналитик", observer: "Наблюдатель" }[r] || r);
const roleColor   = (r: string) => ({ admin: "var(--danger)", architect: "var(--amber)", analyst: "var(--steel)", observer: "var(--text-dim)" }[r] || "var(--text-dim)");
const statusColor = (s: string) => ({ active: "var(--success)", inactive: "var(--text-dim)", blocked: "var(--danger)" }[s] || "var(--text-dim)");
const statusLabel = (s: string) => ({ active: "Активен", inactive: "Не активен", blocked: "Заблокирован" }[s] || s);

const ROLES = ["", "admin", "architect", "analyst", "observer"];
const STATUSES = ["", "active", "inactive", "blocked"];

export default function Users() {
  const isAdmin = userStore.get().role === "admin";
  const [items, setItems]     = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [roleFilter, setRoleFilter]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "", department: "", status: "" });
  const [dirty, setDirty]     = useState(false);
  const [saving, setSaving]   = useState(false);

  // форма создания
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", role: "analyst", department: "", password: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const data = await usersApi.list({ search, role: roleFilter, status: statusFilter });
    setItems(data);
    setLoading(false);
  }, [search, roleFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openDetail = (u: User) => {
    setSelected(u);
    setEditForm({ name: u.name, email: u.email, role: u.role, department: u.department, status: u.status });
    setDirty(false);
  };

  const handleSave = async () => {
    if (!selected || !dirty) return;
    setSaving(true);
    const updated = await usersApi.update(selected.id, editForm);
    setSelected(updated);
    setSaving(false);
    setDirty(false);
    load();
  };

  const handleCreate = async () => {
    if (!createForm.name || !createForm.email) return;
    await usersApi.create(createForm);
    setShowCreate(false);
    setCreateForm({ name: "", email: "", role: "analyst", department: "", password: "" });
    load();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await usersApi.remove(deleteTarget.id);
    if (selected?.id === deleteTarget.id) setSelected(null);
    setDeleteTarget(null);
    load();
  };

  const changeForm = (k: string, v: string) => { setEditForm(p => ({ ...p, [k]: v })); setDirty(true); };

  const initials = (name: string) => name.split(" ").map(w => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col h-full">
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        title={deleteTarget?.name ?? ""}
        description="Пользователь будет удалён из системы."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Пользователи</h1>
          <p className="text-sm text-sec mt-0.5">{items.length} пользователей в системе</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber text-primary-foreground text-sm font-medium rounded hover:opacity-90 transition-opacity">
            <Icon name="UserPlus" size={16} /> Добавить пользователя
          </button>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative z-10 w-full max-w-md mx-4 bg-surface-1 border border-line rounded-lg shadow-2xl p-6 animate-fade-in">
            <h3 className="text-sm font-semibold text-foreground mb-4">Новый пользователь</h3>
            <div className="space-y-3">
              {[["name","ФИО"],["email","Email"],["department","Отдел"],["password","Пароль"]].map(([k, label]) => (
                <div key={k}>
                  <label className="text-xs text-dim block mb-1">{label}</label>
                  <input type={k === "password" ? "password" : "text"}
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50"
                    value={createForm[k as keyof typeof createForm]} onChange={e => setCreateForm(p => ({ ...p, [k]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label className="text-xs text-dim block mb-1">Роль</label>
                <select className="w-full px-3 py-2 bg-surface-2 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50"
                  value={createForm.role} onChange={e => setCreateForm(p => ({ ...p, role: e.target.value }))}>
                  {["admin","architect","analyst","observer"].map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleCreate} className="flex-1 py-2 text-sm bg-amber text-primary-foreground rounded font-medium hover:opacity-90">Создать</button>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm bg-surface-2 border border-line rounded text-sec hover:text-foreground">Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
          <input className="w-full pl-9 pr-3 py-2 bg-surface-1 border border-line rounded text-sm text-foreground placeholder:text-dim focus:outline-none focus:border-amber/50"
            placeholder="Поиск по имени или email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="px-3 py-2 bg-surface-1 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50"
          value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">Все роли</option>
          {ROLES.filter(Boolean).map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
        </select>
        <select className="px-3 py-2 bg-surface-1 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50"
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Все статусы</option>
          {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
        </select>
      </div>

      <div className="flex gap-4 flex-1 overflow-hidden">
        {/* Table */}
        <div className={`${selected ? "w-[55%]" : "w-full"} overflow-auto`}>
          {loading ? (
            <div className="flex items-center justify-center py-20 text-dim"><Icon name="Loader" size={20} className="animate-spin mr-2" /> Загрузка...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider">Пользователь</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-32">Роль</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider">Отдел</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-28">Статус</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-36">Последний вход</th>
                  {isAdmin && <th className="w-10" />}
                </tr>
              </thead>
              <tbody>
                {items.map((u, i) => (
                  <tr key={u.id} onClick={() => openDetail(u)}
                    className={`border-b border-line/50 cursor-pointer transition-colors group animate-fade-in ${selected?.id === u.id ? "bg-surface-2" : "hover:bg-surface-1"}`}
                    style={{ animationDelay: `${i * 0.04}s`, opacity: 0 }}>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-surface-3 border border-line flex items-center justify-center text-xs font-semibold text-amber shrink-0">
                          {initials(u.name)}
                        </div>
                        <div>
                          <div className="font-medium text-foreground text-sm">{u.name}</div>
                          <div className="text-xs text-dim">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-xs font-medium" style={{ color: roleColor(u.role) }}>{roleLabel(u.role)}</span>
                    </td>
                    <td className="py-3 px-3 text-sec text-sm">{u.department || <span className="text-dim italic">—</span>}</td>
                    <td className="py-3 px-3">
                      <span className="flex items-center gap-1.5 text-xs" style={{ color: statusColor(u.status) }}>
                        <span className="status-dot" style={{ background: statusColor(u.status) }} />
                        {statusLabel(u.status)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-dim text-xs">
                      {u.last_login ? new Date(u.last_login).toLocaleString("ru-RU") : "—"}
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-3">
                        <button onClick={e => { e.stopPropagation(); setDeleteTarget(u); }}
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
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-surface-3 border border-amber/30 flex items-center justify-center text-base font-semibold text-amber">
                  {initials(selected.name)}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">{selected.name}</h2>
                  <span className="text-xs text-dim">{selected.email}</span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-dim hover:text-foreground"><Icon name="X" size={16} /></button>
            </div>

            <div className="space-y-4">
              {[["name","ФИО"],["email","Email"],["department","Отдел"]].map(([k, label]) => (
                <div key={k}>
                  <label className="text-xs text-dim block mb-1 uppercase tracking-wider">{label}</label>
                  <input className="w-full px-3 py-2 bg-surface-2 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50"
                    value={editForm[k as keyof typeof editForm]} onChange={e => changeForm(k, e.target.value)} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-dim block mb-1 uppercase tracking-wider">Роль</label>
                  <select className="w-full px-3 py-2 bg-surface-2 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50"
                    value={editForm.role} onChange={e => changeForm("role", e.target.value)}>
                    {["admin","architect","analyst","observer"].map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-dim block mb-1 uppercase tracking-wider">Статус</label>
                  <select className="w-full px-3 py-2 bg-surface-2 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50"
                    value={editForm.status} onChange={e => changeForm("status", e.target.value)}>
                    {["active","inactive","blocked"].map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
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
    </div>
  );
}
