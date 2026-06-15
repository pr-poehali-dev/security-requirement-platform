export type DomainStatus = "active" | "dev" | "inactive" | "archived";

export interface OrgDomain {
  id: string;
  name: string;
  owner: string;
  status: DomainStatus;
  description: string;
  version: number;
  updatedAt: string;
}

const nowStr = () =>
  new Date().toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const INITIAL: OrgDomain[] = [
  { id: "org-dom-001", name: "Банковский сегмент",  owner: "А. Петров",  status: "active",   description: "Основной домен банковской инфраструктуры, включает АБС и процессинг.", version: 3, updatedAt: "06.06.2026 09:14" },
  { id: "org-dom-002", name: "ДМЗ периметр",        owner: "И. Смирнова", status: "active",   description: "Демилитаризованная зона: веб-серверы, WAF, балансировщики.",            version: 2, updatedAt: "05.06.2026 17:22" },
  { id: "org-dom-003", name: "Офисная сеть",        owner: "М. Козлов",   status: "dev",      description: "Сегмент рабочих станций и принтеров сотрудников.",                      version: 1, updatedAt: "04.06.2026 11:00" },
  { id: "org-dom-004", name: "Резервный ЦОД",       owner: "В. Новиков",  status: "inactive", description: "Резервная площадка для DR-процедур и учений.",                          version: 1, updatedAt: "01.06.2026 08:30" },
];

// ── shared in-memory store ──────────────────────────────────
let globalDomains: OrgDomain[] = [...INITIAL];
const listeners = new Set<() => void>();

const notify = () => listeners.forEach(fn => fn());

export const orgDomainsStore = {
  get:    ()                   => globalDomains,
  set:    (next: OrgDomain[])  => { globalDomains = next; notify(); },
  sub:    (fn: () => void)     => { listeners.add(fn); return () => listeners.delete(fn); },

  add: () => {
    const maxNum = globalDomains.reduce((max, d) => {
      const n = parseInt(d.id.replace("org-dom-", ""), 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
    const newDomain: OrgDomain = {
      id: `org-dom-${String(maxNum + 1).padStart(3, "0")}`,
      name: "Новый домен", owner: "", status: "dev",
      description: "", version: 1, updatedAt: nowStr(),
    };
    globalDomains = [newDomain, ...globalDomains];
    notify();
    return newDomain.id;
  },

  save: (id: string, patch: Partial<Omit<OrgDomain, "id" | "version" | "updatedAt">>) => {
    globalDomains = globalDomains.map(d =>
      d.id === id
        ? { ...d, ...patch, version: d.version + 1, updatedAt: nowStr() }
        : d
    );
    notify();
  },

  remove: (id: string) => {
    globalDomains = globalDomains.filter(d => d.id !== id);
    notify();
  },
};

// для обратной совместимости с TechDomains (read-only список)
export const ORG_DOMAINS_INITIAL = INITIAL;
