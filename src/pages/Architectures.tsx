import { useState } from "react";
import Icon from "@/components/ui/icon";

const ARCHITECTURES = [
  {
    id: "ARCH-001",
    title: "Корпоративная сеть банка",
    description: "Типовая архитектура сети для финансовых организаций с DMZ, сегментацией и WAF",
    category: "Финансовый сектор",
    status: "approved",
    requirements: 18,
    components: 12,
    updated: "02.06.2026",
    author: "А. Петров",
    tags: ["DMZ", "WAF", "Firewall", "SIEM"],
  },
  {
    id: "ARCH-002",
    title: "Защита АСУ ТП",
    description: "Архитектура защиты автоматизированных систем управления технологическими процессами",
    category: "КИИ",
    status: "approved",
    requirements: 24,
    components: 16,
    updated: "28.05.2026",
    author: "И. Смирнов",
    tags: ["ICS", "SCADA", "Air Gap", "КИИ"],
  },
  {
    id: "ARCH-003",
    title: "Облачная инфраструктура (Hybrid)",
    description: "Гибридная облачная среда с контролем доступа, шифрованием и мониторингом",
    category: "Облачные сервисы",
    status: "review",
    requirements: 15,
    components: 9,
    updated: "20.05.2026",
    author: "М. Козлова",
    tags: ["Zero Trust", "IAM", "CASB"],
  },
  {
    id: "ARCH-004",
    title: "Удалённый доступ сотрудников",
    description: "Безопасный удалённый доступ с MFA, VPN и контролем устройств",
    category: "Корпоративный доступ",
    status: "approved",
    requirements: 10,
    components: 7,
    updated: "15.05.2026",
    author: "А. Петров",
    tags: ["VPN", "MFA", "EDR", "MDM"],
  },
  {
    id: "ARCH-005",
    title: "Центр обработки данных (ЦОД)",
    description: "Физическая и логическая защита дата-центра с мониторингом и резервированием",
    category: "ЦОД",
    status: "draft",
    requirements: 21,
    components: 14,
    updated: "08.05.2026",
    author: "В. Новиков",
    tags: ["Physical Security", "HA", "DR"],
  },
];

const statusLabel = (s: string) => ({ approved: "Утверждена", review: "На проверке", draft: "Черновик" }[s] || s);
const statusColor = (s: string) => ({ approved: "var(--success)", review: "var(--amber)", draft: "var(--text-dim)" }[s] || "var(--text-dim)");

const ARCH_DIAGRAM = [
  { id: "inet", label: "Интернет", x: 50, y: 20, icon: "Globe", color: "var(--text-dim)" },
  { id: "waf", label: "WAF", x: 50, y: 35, icon: "Shield", color: "var(--amber)" },
  { id: "dmz", label: "DMZ", x: 50, y: 50, icon: "Network", color: "var(--steel)" },
  { id: "fw", label: "Firewall", x: 50, y: 65, icon: "ShieldCheck", color: "var(--amber)" },
  { id: "core", label: "Ядро сети", x: 50, y: 80, icon: "Cpu", color: "var(--success)" },
];

export default function Architectures() {
  const [selected, setSelected] = useState<typeof ARCHITECTURES[0] | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Архитектуры</h1>
          <p className="text-sm text-sec mt-0.5">{ARCHITECTURES.length} типовых архитектур</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-surface-1 border border-line rounded overflow-hidden">
            <button
              onClick={() => setView("grid")}
              className={`p-2 transition-colors ${view === "grid" ? "bg-surface-2 text-amber" : "text-dim hover:text-foreground"}`}
            >
              <Icon name="LayoutGrid" size={15} />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-2 transition-colors ${view === "list" ? "bg-surface-2 text-amber" : "text-dim hover:text-foreground"}`}
            >
              <Icon name="List" size={15} />
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-amber text-primary-foreground text-sm font-medium rounded hover:opacity-90 transition-opacity">
            <Icon name="Plus" size={16} />
            Новая архитектура
          </button>
        </div>
      </div>

      <div className={`flex gap-4 ${selected ? "h-[calc(100%-80px)]" : ""}`}>
        {/* List */}
        <div className={`${selected ? "w-[420px] shrink-0" : "w-full"} overflow-auto`}>
          {view === "grid" && !selected ? (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
              {ARCHITECTURES.map((arch, i) => (
                <div
                  key={arch.id}
                  onClick={() => setSelected(arch)}
                  className="bg-surface-1 border border-line rounded p-4 cursor-pointer hover:border-amber/40 transition-all group animate-fade-in"
                  style={{ animationDelay: `${i * 0.06}s`, opacity: 0 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="font-mono text-xs text-steel">{arch.id}</span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: statusColor(arch.status) }}>
                      <span className="status-dot" style={{ background: statusColor(arch.status) }}></span>
                      {statusLabel(arch.status)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground text-sm mb-2 group-hover:text-amber transition-colors">{arch.title}</h3>
                  <p className="text-xs text-sec leading-relaxed mb-3 line-clamp-2">{arch.description}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {arch.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="tag-info">{tag}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-dim pt-2 border-t border-line/50">
                    <span>{arch.requirements} требований</span>
                    <span>{arch.components} компонентов</span>
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
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-24">Требований</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-28">Статус</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-dim uppercase tracking-wider w-28">Обновлена</th>
                </tr>
              </thead>
              <tbody>
                {ARCHITECTURES.map((arch, i) => (
                  <tr
                    key={arch.id}
                    onClick={() => setSelected(selected?.id === arch.id ? null : arch)}
                    className={`border-b border-line/50 cursor-pointer transition-colors animate-fade-in ${selected?.id === arch.id ? "bg-surface-2" : "hover:bg-surface-1"}`}
                    style={{ animationDelay: `${i * 0.04}s`, opacity: 0 }}
                  >
                    <td className="py-3 px-3 font-mono text-xs text-steel">{arch.id}</td>
                    <td className="py-3 px-3 font-medium text-foreground">{arch.title}</td>
                    <td className="py-3 px-3 text-sec">{arch.category}</td>
                    <td className="py-3 px-3 text-sec">{arch.requirements}</td>
                    <td className="py-3 px-3">
                      <span className="flex items-center gap-1.5 text-xs" style={{ color: statusColor(arch.status) }}>
                        <span className="status-dot" style={{ background: statusColor(arch.status) }}></span>
                        {statusLabel(arch.status)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-dim text-xs">{arch.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="flex-1 bg-surface-1 border border-line rounded p-5 overflow-auto animate-fade-in">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="font-mono text-xs text-steel">{selected.id}</span>
                <h2 className="text-lg font-semibold text-foreground mt-1">{selected.title}</h2>
                <p className="text-sm text-sec mt-1">{selected.description}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-dim hover:text-foreground transition-colors ml-4">
                <Icon name="X" size={16} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-surface-2 rounded p-3">
                <span className="text-xs text-dim block mb-1">Требований</span>
                <span className="text-xl font-semibold text-amber">{selected.requirements}</span>
              </div>
              <div className="bg-surface-2 rounded p-3">
                <span className="text-xs text-dim block mb-1">Компонентов</span>
                <span className="text-xl font-semibold text-steel">{selected.components}</span>
              </div>
              <div className="bg-surface-2 rounded p-3">
                <span className="text-xs text-dim block mb-1">Статус</span>
                <span className="text-sm font-medium" style={{ color: statusColor(selected.status) }}>{statusLabel(selected.status)}</span>
              </div>
            </div>

            {/* Mini diagram */}
            <div className="bg-surface-2 rounded p-4 mb-4 relative overflow-hidden grid-bg">
              <p className="text-xs text-dim mb-3 uppercase tracking-wider">Схема архитектуры</p>
              <div className="flex flex-col items-center gap-0">
                {ARCH_DIAGRAM.map((node, i) => (
                  <div key={node.id} className="flex flex-col items-center">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-1/80 border border-line rounded text-xs font-medium backdrop-blur-sm"
                         style={{ color: node.color, borderColor: node.color + "40" }}>
                      <Icon name={node.icon as "Globe"} size={12} />
                      {node.label}
                    </div>
                    {i < ARCH_DIAGRAM.length - 1 && (
                      <div className="w-px h-4 bg-gradient-to-b from-border to-transparent"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs text-dim uppercase tracking-wider mb-2">Теги</p>
              <div className="flex flex-wrap gap-1.5">
                {selected.tags.map(tag => <span key={tag} className="tag-info">{tag}</span>)}
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-line">
              <button className="flex-1 py-2 text-xs bg-amber text-primary-foreground rounded font-medium hover:opacity-90 transition-opacity">Редактировать</button>
              <button className="px-4 py-2 text-xs bg-surface-2 border border-line rounded text-foreground hover:border-steel/40 transition-colors">Экспорт</button>
              <button className="px-4 py-2 text-xs bg-surface-2 border border-line rounded text-foreground hover:border-steel/40 transition-colors">Клонировать</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
