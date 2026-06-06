import { useState } from "react";
import Icon from "@/components/ui/icon";

const SECTIONS = [
  { id: "general", label: "Общие", icon: "Settings" },
  { id: "security", label: "Безопасность", icon: "ShieldCheck" },
  { id: "notifications", label: "Уведомления", icon: "Bell" },
  { id: "integrations", label: "Интеграции", icon: "Plug" },
  { id: "audit", label: "Журнал аудита", icon: "ScrollText" },
];

const AUDIT_LOG = [
  { id: 1, time: "06.06.2026 09:14", user: "А. Петров", action: "Изменено требование REQ-003", type: "update" },
  { id: 2, time: "06.06.2026 08:50", user: "И. Смирнова", action: "Создана архитектура ARCH-005", type: "create" },
  { id: 3, time: "05.06.2026 17:22", user: "М. Козлов", action: "Применён шаблон TPL-003 к ARCH-003", type: "action" },
  { id: 4, time: "05.06.2026 16:10", user: "А. Петров", action: "Изменена роль пользователя USR-0006", type: "update" },
  { id: 5, time: "05.06.2026 14:05", user: "В. Новиков", action: "Удалено требование REQ-009 (черновик)", type: "delete" },
  { id: 6, time: "04.06.2026 11:30", user: "Система", action: "Успешная синхронизация с Active Directory", type: "system" },
  { id: 7, time: "04.06.2026 09:00", user: "Система", action: "Автоматическое резервное копирование БД", type: "system" },
];

const actionColor = (t: string) => ({
  create: "var(--success)", update: "var(--amber)", delete: "var(--danger)", action: "var(--steel)", system: "var(--text-dim)"
}[t] || "var(--text-dim)");

const actionIcon = (t: string) => ({
  create: "Plus", update: "Pencil", delete: "Trash2", action: "Play", system: "Cpu"
}[t] || "Info") as "Plus";

type ToggleState = {
  mfa: boolean;
  sessionTimeout: boolean;
  ipWhitelist: boolean;
  emailNotify: boolean;
  smsNotify: boolean;
  archApproval: boolean;
  reqChange: boolean;
  adSync: boolean;
  siem: boolean;
  jira: boolean;
};

export default function Settings() {
  const [activeSection, setActiveSection] = useState("general");
  const [toggles, setToggles] = useState<ToggleState>({
    mfa: true, sessionTimeout: true, ipWhitelist: false,
    emailNotify: true, smsNotify: false,
    archApproval: true, reqChange: true,
    adSync: true, siem: false, jira: false,
  });

  const toggle = (key: keyof ToggleState) => setToggles(p => ({ ...p, [key]: !p[key] }));

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Настройки</h1>
        <p className="text-sm text-sec mt-0.5">Конфигурация платформы</p>
      </div>

      <div className="flex gap-5 flex-1 overflow-auto">
        {/* Sidebar nav */}
        <div className="w-44 shrink-0">
          <nav className="space-y-0.5">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-sm transition-colors ${
                  activeSection === s.id
                    ? "bg-amber/10 text-amber border border-amber/20"
                    : "text-sec hover:bg-surface-1 hover:text-foreground border border-transparent"
                }`}
              >
                <Icon name={s.icon as "Settings"} size={15} />
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {activeSection === "general" && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-surface-1 border border-line rounded p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Сведения об организации</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Название организации", value: "ООО «СекьюрАрх»", placeholder: "" },
                    { label: "Краткое наименование", value: "SecureArch", placeholder: "" },
                    { label: "ИНН", value: "7701234567", placeholder: "" },
                    { label: "Домен AD", value: "secarch.ru", placeholder: "" },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="text-xs text-dim block mb-1.5">{f.label}</label>
                      <input
                        defaultValue={f.value}
                        className="w-full px-3 py-2 bg-surface-2 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50 transition-colors"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-surface-1 border border-line rounded p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Параметры платформы</h3>
                <div className="space-y-3">
                  {[
                    { label: "Часовой пояс", options: ["Europe/Moscow (UTC+3)", "Europe/Samara (UTC+4)", "Asia/Yekaterinburg (UTC+5)"] },
                    { label: "Язык интерфейса", options: ["Русский", "English"] },
                    { label: "Формат даты", options: ["ДД.ММ.ГГГГ", "ГГГГ-ММ-ДД", "ММ/ДД/ГГГГ"] },
                  ].map(f => (
                    <div key={f.label} className="flex items-center justify-between">
                      <label className="text-sm text-sec">{f.label}</label>
                      <select className="px-3 py-1.5 bg-surface-2 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50 transition-colors min-w-52">
                        {f.options.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button className="px-5 py-2 bg-amber text-primary-foreground text-sm font-medium rounded hover:opacity-90 transition-opacity">
                  Сохранить изменения
                </button>
              </div>
            </div>
          )}

          {activeSection === "security" && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-surface-1 border border-line rounded p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Политика аутентификации</h3>
                <div className="space-y-4">
                  {[
                    { key: "mfa" as keyof ToggleState, label: "Многофакторная аутентификация (MFA)", desc: "Обязательная MFA для всех пользователей" },
                    { key: "sessionTimeout" as keyof ToggleState, label: "Автовыход по таймауту", desc: "Завершать сессию через 30 минут бездействия" },
                    { key: "ipWhitelist" as keyof ToggleState, label: "Белый список IP-адресов", desc: "Ограничить доступ по IP-адресам" },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between py-3 border-b border-line/50">
                      <div>
                        <p className="text-sm text-foreground font-medium">{item.label}</p>
                        <p className="text-xs text-dim mt-0.5">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => toggle(item.key)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${toggles[item.key] ? "bg-amber" : "bg-surface-3 border border-line"}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform ${toggles[item.key] ? "translate-x-5 bg-primary-foreground" : "translate-x-0.5 bg-muted-foreground"}`}></span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-surface-1 border border-line rounded p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Политика паролей</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Минимальная длина", value: "12" },
                    { label: "Срок действия (дней)", value: "90" },
                    { label: "История паролей", value: "10" },
                    { label: "Блокировка (попыток)", value: "5" },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="text-xs text-dim block mb-1.5">{f.label}</label>
                      <input
                        type="number"
                        defaultValue={f.value}
                        className="w-full px-3 py-2 bg-surface-2 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50 transition-colors"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === "notifications" && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-surface-1 border border-line rounded p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Каналы уведомлений</h3>
                <div className="space-y-3">
                  {[
                    { key: "emailNotify" as keyof ToggleState, label: "Email уведомления", desc: "Отправлять на корпоративную почту" },
                    { key: "smsNotify" as keyof ToggleState, label: "SMS уведомления", desc: "Для критических событий" },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between py-3 border-b border-line/50">
                      <div>
                        <p className="text-sm text-foreground">{item.label}</p>
                        <p className="text-xs text-dim mt-0.5">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => toggle(item.key)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${toggles[item.key] ? "bg-amber" : "bg-surface-3 border border-line"}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform ${toggles[item.key] ? "translate-x-5 bg-primary-foreground" : "translate-x-0.5 bg-muted-foreground"}`}></span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-surface-1 border border-line rounded p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Триггеры уведомлений</h3>
                <div className="space-y-3">
                  {[
                    { key: "archApproval" as keyof ToggleState, label: "Архитектура требует утверждения" },
                    { key: "reqChange" as keyof ToggleState, label: "Изменение критических требований" },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between py-2.5">
                      <p className="text-sm text-sec">{item.label}</p>
                      <button
                        onClick={() => toggle(item.key)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${toggles[item.key] ? "bg-amber" : "bg-surface-3 border border-line"}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform ${toggles[item.key] ? "translate-x-5 bg-primary-foreground" : "translate-x-0.5 bg-muted-foreground"}`}></span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === "integrations" && (
            <div className="space-y-4 animate-fade-in">
              {[
                { key: "adSync" as keyof ToggleState, title: "Active Directory / LDAP", desc: "Синхронизация пользователей и ролей из AD", icon: "Users", status: "Подключено" },
                { key: "siem" as keyof ToggleState, title: "SIEM (MaxPatrol SIEM)", desc: "Интеграция событий безопасности", icon: "Activity", status: "Не настроено" },
                { key: "jira" as keyof ToggleState, title: "Jira / GitLab Issues", desc: "Создание задач по требованиям", icon: "GitBranch", status: "Не настроено" },
              ].map(item => (
                <div key={item.key} className="bg-surface-1 border border-line rounded p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded bg-surface-2 border border-line flex items-center justify-center shrink-0">
                    <Icon name={item.icon as "Users"} size={18} className={toggles[item.key] ? "text-amber" : "text-dim"} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-dim mt-0.5">{item.desc}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: toggles[item.key] ? "var(--success)" : "var(--text-dim)" }}>
                      {toggles[item.key] ? "Активно" : item.status}
                    </span>
                    <button
                      onClick={() => toggle(item.key)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${toggles[item.key] ? "bg-amber" : "bg-surface-3 border border-line"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform ${toggles[item.key] ? "translate-x-5 bg-primary-foreground" : "translate-x-0.5 bg-muted-foreground"}`}></span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === "audit" && (
            <div className="animate-fade-in">
              <div className="bg-surface-1 border border-line rounded overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-line">
                  <h3 className="text-sm font-semibold text-foreground">Журнал аудита</h3>
                  <button className="flex items-center gap-1.5 text-xs text-sec hover:text-foreground transition-colors">
                    <Icon name="Download" size={13} />
                    Экспорт CSV
                  </button>
                </div>
                <div className="divide-y divide-line/50">
                  {AUDIT_LOG.map((entry, i) => (
                    <div key={entry.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition-colors animate-fade-in"
                         style={{ animationDelay: `${i * 0.04}s`, opacity: 0 }}>
                      <div className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                           style={{ background: actionColor(entry.type) + "20" }}>
                        <Icon name={actionIcon(entry.type)} size={12} style={{ color: actionColor(entry.type) }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{entry.action}</p>
                        <p className="text-xs text-dim mt-0.5">{entry.user}</p>
                      </div>
                      <span className="text-xs text-dim font-mono shrink-0">{entry.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
