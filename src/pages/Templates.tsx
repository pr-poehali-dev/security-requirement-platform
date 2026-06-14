import { useState } from "react";
import Icon from "@/components/ui/icon";
import ConfirmDeleteDialog from "@/components/ui/confirm-delete-dialog";
import { userStore } from "@/data/userStore";

const TEMPLATES = [
  {
    id: "TPL-001",
    title: "Банк (Tier 1)",
    icon: "Building2",
    description: "Полный набор требований для банков первого уровня по ГОСТ Р 57580 и 382-П",
    category: "Финансы",
    reqs: 42,
    compliance: ["ГОСТ Р 57580", "382-П", "PCI DSS"],
    complexity: "high",
    usedCount: 14,
  },
  {
    id: "TPL-002",
    title: "КИИ (Категория 1)",
    icon: "Zap",
    description: "Требования для объектов критической информационной инфраструктуры первой категории",
    category: "КИИ",
    reqs: 56,
    compliance: ["187-ФЗ", "ФСТЭК", "ГосСОПКА"],
    complexity: "high",
    usedCount: 8,
  },
  {
    id: "TPL-003",
    title: "Медицинская организация",
    icon: "HeartPulse",
    description: "Защита персональных данных пациентов и медицинских информационных систем",
    category: "Здравоохранение",
    reqs: 31,
    compliance: ["152-ФЗ", "ГОСТ Р 57580"],
    complexity: "medium",
    usedCount: 22,
  },
  {
    id: "TPL-004",
    title: "Государственные ИС (ГИС)",
    icon: "Landmark",
    description: "Требования для государственных информационных систем по 149-ФЗ и требованиям ФСТЭК",
    category: "Государственный сектор",
    reqs: 38,
    compliance: ["149-ФЗ", "ФСТЭК", "ФСБ"],
    complexity: "high",
    usedCount: 6,
  },
  {
    id: "TPL-005",
    title: "Облачный провайдер",
    icon: "Cloud",
    description: "Минимальный набор требований для облачных платформ и SaaS-сервисов",
    category: "Облачные сервисы",
    reqs: 27,
    compliance: ["ISO 27001", "SOC 2", "CSA STAR"],
    complexity: "medium",
    usedCount: 31,
  },
  {
    id: "TPL-006",
    title: "Малый и средний бизнес",
    icon: "Store",
    description: "Базовый набор мер ИБ для компаний без регуляторных требований",
    category: "МСБ",
    reqs: 15,
    compliance: ["CIS Controls", "ISO 27001"],
    complexity: "low",
    usedCount: 87,
  },
];

const complexityLabel = (c: string) => ({ high: "Сложный", medium: "Средний", low: "Базовый" }[c] || c);
const complexityClass = (c: string) => ({ high: "tag-critical", medium: "tag-medium", low: "tag-low" }[c] || "tag-info");

export default function Templates() {
  const [items, setItems] = useState(TEMPLATES);
  const [selected, setSelected] = useState<typeof TEMPLATES[0] | null>(null);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const isAdmin = userStore.get().role === "admin";

  const filtered = items.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteClick = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget({ id, title });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setItems(prev => prev.filter(t => t.id !== deleteTarget.id));
    if (selected?.id === deleteTarget.id) setSelected(null);
    setDeleteTarget(null);
  };

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
          <Icon name="Plus" size={16} />
          Создать шаблон
        </button>
      </div>

      <div className="relative mb-5 max-w-sm">
        <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
        <input
          className="w-full pl-9 pr-3 py-2 bg-surface-1 border border-line rounded text-sm text-foreground placeholder:text-dim focus:outline-none focus:border-amber/50 transition-colors"
          placeholder="Поиск шаблонов..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="flex gap-5 flex-1 overflow-auto">
        <div className={`${selected ? "w-[480px] shrink-0" : "w-full"} grid ${selected ? "grid-cols-1" : "grid-cols-2 xl:grid-cols-3"} gap-4 content-start overflow-auto`}>
          {filtered.map((tpl, i) => (
            <div
              key={tpl.id}
              onClick={() => setSelected(selected?.id === tpl.id ? null : tpl)}
              className={`bg-surface-1 border rounded p-5 cursor-pointer transition-all group animate-fade-in relative ${selected?.id === tpl.id ? "border-amber/50 glow-amber" : "border-line hover:border-amber/30"}`}
              style={{ animationDelay: `${i * 0.06}s`, opacity: 0 }}
            >
              {isAdmin && (
                <button
                  onClick={e => handleDeleteClick(tpl.id, tpl.title, e)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-dim hover:text-danger transition-all z-10"
                  title="Удалить"
                >
                  <Icon name="Trash2" size={13} />
                </button>
              )}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded bg-surface-2 border border-line flex items-center justify-center shrink-0 group-hover:border-amber/30 transition-colors">
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
                {tpl.compliance.map(c => (
                  <span key={c} className="tag-info">{c}</span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-line/50">
                <span className="text-xs text-dim">{tpl.reqs} требований</span>
                <span className="text-xs text-dim flex items-center gap-1">
                  <Icon name="Users" size={11} />
                  Использован {tpl.usedCount} раз
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
                <span className="text-xs text-dim block mb-1">Требований в шаблоне</span>
                <span className="text-2xl font-semibold text-amber">{selected.reqs}</span>
              </div>
              <div className="bg-surface-2 rounded p-3">
                <span className="text-xs text-dim block mb-1">Сложность</span>
                <span className={complexityClass(selected.complexity)}>{complexityLabel(selected.complexity)}</span>
              </div>
            </div>

            <div className="mb-5">
              <p className="text-xs text-dim uppercase tracking-wider mb-2">Регуляторные стандарты</p>
              <div className="flex flex-col gap-1.5">
                {selected.compliance.map(c => (
                  <div key={c} className="flex items-center gap-2 bg-surface-2 rounded px-3 py-2">
                    <Icon name="CheckCircle" size={13} className="text-success" />
                    <span className="text-sm text-foreground font-mono">{c}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-5 bg-surface-2 rounded p-3 flex items-center gap-2 text-xs text-sec">
              <Icon name="BarChart2" size={13} className="text-steel" />
              Шаблон использован {selected.usedCount} раз в проектах
            </div>

            <div className="flex gap-2">
              <button className="flex-1 py-2 text-xs bg-amber text-primary-foreground rounded font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                <Icon name="GitBranch" size={13} />
                Применить к архитектуре
              </button>
              <button className="px-4 py-2 text-xs bg-surface-2 border border-line rounded text-foreground hover:border-amber/40 transition-colors">
                Клонировать
              </button>
              {isAdmin && (
                <button
                  onClick={e => handleDeleteClick(selected.id, selected.title, e)}
                  className="px-4 py-2 text-xs bg-surface-2 border border-line rounded text-dim hover:text-danger hover:border-danger/30 transition-colors flex items-center gap-1.5"
                >
                  <Icon name="Trash2" size={13} />
                  Удалить
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}