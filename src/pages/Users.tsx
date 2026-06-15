import { useState } from "react";
import Icon from "@/components/ui/icon";

const USERS = [
  { id: 1, name: "Александр Петров", email: "a.petrov@secarch.ru", role: "admin", dept: "Служба ИБ", status: "active", lastLogin: "06.06.2026 09:14", avatar: "АП" },
  { id: 2, name: "Ирина Смирнова", email: "i.smirnova@secarch.ru", role: "architect", dept: "Служба ИБ", status: "active", lastLogin: "06.06.2026 08:50", avatar: "ИС" },
  { id: 3, name: "Михаил Козлов", email: "m.kozlov@secarch.ru", role: "analyst", dept: "ИТ-архитектура", status: "active", lastLogin: "05.06.2026 17:22", avatar: "МК" },
  { id: 4, name: "Виктор Новиков", email: "v.novikov@secarch.ru", role: "architect", dept: "Служба ИБ", status: "active", lastLogin: "05.06.2026 14:05", avatar: "ВН" },
  { id: 5, name: "Елена Фёдорова", email: "e.fedorova@secarch.ru", role: "viewer", dept: "Риск-менеджмент", status: "active", lastLogin: "04.06.2026 11:30", avatar: "ЕФ" },
  { id: 6, name: "Андрей Соколов", email: "a.sokolov@secarch.ru", role: "analyst", dept: "ИТ-архитектура", status: "inactive", lastLogin: "15.05.2026 16:45", avatar: "АС" },
  { id: 7, name: "Наталья Волкова", email: "n.volkova@secarch.ru", role: "viewer", dept: "Юридический отдел", status: "active", lastLogin: "03.06.2026 10:20", avatar: "НВ" },
  { id: 8, name: "Дмитрий Лебедев", email: "d.lebedev@secarch.ru", role: "analyst", dept: "Комплаенс", status: "blocked", lastLogin: "01.06.2026 09:00", avatar: "ДЛ" },
];

const ROLES: Record<string, { label: string; color: string; desc: string }> = {
  admin: { label: "Администратор", color: "var(--amber)", desc: "Полный доступ" },
  architect: { label: "Архитектор", color: "var(--steel)", desc: "Создание архитектур" },
  analyst: { label: "Аналитик", color: "var(--success)", desc: "Управление требованиями" },
  viewer: { label: "Наблюдатель", color: "var(--text-secondary)", desc: "Только чтение" },
};

const STATUS: Record<string, { label: string; color: string }> = {
  active: { label: "Активен", color: "var(--success)" },
  inactive: { label: "Неактивен", color: "var(--text-dim)" },
  blocked: { label: "Заблокирован", color: "var(--danger)" },
};

export default function Users() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selected, setSelected] = useState<typeof USERS[0] | null>(null);

  const filtered = USERS.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Пользователи</h1>
          <p className="text-sm text-sec mt-0.5">{USERS.filter(u => u.status === "active").length} активных из {USERS.length}</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-amber text-primary-foreground text-sm font-medium rounded hover:opacity-90 transition-opacity">
          <Icon name="UserPlus" size={16} />
          Добавить пользователя
        </button>
      </div>

      {/* Role stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {Object.entries(ROLES).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setRoleFilter(roleFilter === key ? "all" : key)}
            className={`bg-surface-1 border rounded p-3 text-left transition-all ${roleFilter === key ? "border-amber/50" : "border-line hover:border-amber/20"}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium" style={{ color: val.color }}>{val.label}</span>
              <span className="text-lg font-semibold text-foreground">{USERS.filter(u => u.role === key).length}</span>
            </div>
            <p className="text-xs text-dim">{val.desc}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
        <input
          className="w-full pl-9 pr-3 py-2 bg-surface-1 border border-line rounded text-sm text-foreground placeholder:text-dim focus:outline-none focus:border-amber/50 transition-colors"
          placeholder="Поиск по имени или email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="flex gap-4 flex-1 overflow-auto">
        {/* Table */}
        <div className={`${selected ? "w-[520px] shrink-0" : "flex-1"} overflow-auto`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider">Сотрудник</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider">Роль</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider">Отдел</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-28">Статус</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider">Последний вход</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, i) => (
                <tr
                  key={user.id}
                  onClick={() => setSelected(selected?.id === user.id ? null : user)}
                  className={`border-b border-line/50 cursor-pointer transition-colors group animate-fade-in ${selected?.id === user.id ? "bg-surface-2" : "hover:bg-surface-1"}`}
                  style={{ animationDelay: `${i * 0.03}s`, opacity: 0 }}
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                           style={{ background: `hsl(var(--surface-3))`, color: ROLES[user.role]?.color }}>
                        {user.avatar}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{user.name}</div>
                        <div className="text-xs text-dim">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-xs font-medium" style={{ color: ROLES[user.role]?.color }}>
                      {ROLES[user.role]?.label}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-sec text-sm">{user.dept}</td>
                  <td className="py-3 px-3">
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: STATUS[user.status]?.color }}>
                      <span className="status-dot" style={{ background: STATUS[user.status]?.color }}></span>
                      {STATUS[user.status]?.label}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-dim text-xs font-mono">{user.lastLogin}</td>
                  <td className="py-3 px-3">
                    <Icon name="ChevronRight" size={14} className="text-dim opacity-0 group-hover:opacity-100 transition-opacity" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* User detail */}
        {selected && (
          <div className="flex-1 bg-surface-1 border border-line rounded p-5 overflow-auto animate-fade-in">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold"
                     style={{ background: `hsl(var(--surface-3))`, color: ROLES[selected.role]?.color }}>
                  {selected.avatar}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">{selected.name}</h2>
                  <p className="text-xs text-dim">{selected.email}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-dim hover:text-foreground transition-colors">
                <Icon name="X" size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
              <div className="bg-surface-2 rounded p-3">
                <span className="text-xs text-dim block mb-1">Роль</span>
                <span className="font-medium" style={{ color: ROLES[selected.role]?.color }}>{ROLES[selected.role]?.label}</span>
                <p className="text-xs text-dim mt-0.5">{ROLES[selected.role]?.desc}</p>
              </div>
              <div className="bg-surface-2 rounded p-3">
                <span className="text-xs text-dim block mb-1">Статус</span>
                <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: STATUS[selected.status]?.color }}>
                  <span className="status-dot" style={{ background: STATUS[selected.status]?.color }}></span>
                  {STATUS[selected.status]?.label}
                </span>
              </div>
            </div>

            <div className="space-y-2 mb-5 text-sm">
              <div className="flex justify-between py-2 border-b border-line/50">
                <span className="text-dim">Отдел</span>
                <span className="text-foreground">{selected.dept}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-line/50">
                <span className="text-dim">Последний вход</span>
                <span className="text-foreground font-mono text-xs">{selected.lastLogin}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-dim">ID пользователя</span>
                <span className="text-steel font-mono text-xs">USR-{String(selected.id).padStart(4, "0")}</span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs text-dim uppercase tracking-wider mb-2">Доступные разделы</p>
              <div className="space-y-1.5">
                {["Требования", "Архитектуры", "Шаблоны"].map(section => (
                  <div key={section} className="flex items-center justify-between bg-surface-2 rounded px-3 py-2 text-xs">
                    <span className="text-foreground">{section}</span>
                    <span className="text-success flex items-center gap-1">
                      <Icon name="Check" size={11} />
                      {selected.role === "viewer" ? "Чтение" : "Полный доступ"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-line">
              <button className="flex-1 py-2 text-xs bg-amber text-primary-foreground rounded font-medium hover:opacity-90 transition-opacity">Редактировать</button>
              {selected.status === "active" ? (
                <button className="px-3 py-2 text-xs bg-surface-2 border border-line rounded text-danger hover:border-danger/40 transition-colors">Заблокировать</button>
              ) : (
                <button className="px-3 py-2 text-xs bg-surface-2 border border-line rounded text-success hover:border-success/40 transition-colors">Активировать</button>
              )}
              <button className="px-3 py-2 text-xs bg-surface-2 border border-line rounded text-foreground hover:border-steel/40 transition-colors">Сбросить пароль</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
