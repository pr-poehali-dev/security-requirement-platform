export interface OrgDomain {
  id: string;
  name: string;
  owner: string;
  status: "active" | "dev" | "inactive" | "archived";
  description: string;
  version: number;
  updatedAt: string;
}

export const ORG_DOMAINS_INITIAL: OrgDomain[] = [
  { id: "org-dom-001", name: "Банковский сегмент", owner: "А. Петров", status: "active", description: "Основной домен банковской инфраструктуры, включает АБС и процессинг.", version: 3, updatedAt: "06.06.2026 09:14" },
  { id: "org-dom-002", name: "ДМЗ периметр", owner: "И. Смирнова", status: "active", description: "Демилитаризованная зона: веб-серверы, WAF, балансировщики.", version: 2, updatedAt: "05.06.2026 17:22" },
  { id: "org-dom-003", name: "Офисная сеть", owner: "М. Козлов", status: "dev", description: "Сегмент рабочих станций и принтеров сотрудников.", version: 1, updatedAt: "04.06.2026 11:00" },
  { id: "org-dom-004", name: "Резервный ЦОД", owner: "В. Новиков", status: "inactive", description: "Резервная площадка для DR-процедур и учений.", version: 1, updatedAt: "01.06.2026 08:30" },
];
