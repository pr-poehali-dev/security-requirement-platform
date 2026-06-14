import { api } from "./client";

// ── Types ────────────────────────────────────────────────────────────────────
export interface Requirement {
  id: string; title: string; description: string; category: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "active" | "draft" | "review" | "archived";
  source: string; version: number; created_at: string; updated_at: string;
  comments: { id: number; text: string; user_id: string | null; created_at: string }[];
  links: { id: number; target_id: string; link_type: string }[];
}

export interface Architecture {
  id: string; title: string; description: string; category: string;
  status: "approved" | "review" | "draft";
  author: string; version: number; created_at: string; updated_at: string;
  tags: { id: number; tag: string }[];
  req_links: { id: number; requirement_id: string; compliance_status: string }[];
}

export interface Template {
  id: string; title: string; icon: string; description: string; category: string;
  complexity: "high" | "medium" | "low";
  used_count: number; created_at: string; updated_at: string;
  compliance: { id: number; standard_name: string }[];
}

export interface OrgDomain {
  id: string; name: string; owner: string;
  status: "active" | "dev" | "inactive" | "archived";
  description: string; version: number; created_at: string; updated_at: string;
}

export interface TechDomain {
  id: string; name: string; owner: string;
  status: "active" | "dev" | "inactive" | "archived";
  description: string; version: number; created_at: string; updated_at: string;
  org_links: { id: number; org_domain_id: string }[];
}

export interface Technology {
  id: string; name: string; owner: string;
  status: "active" | "dev" | "inactive" | "archived";
  description: string; version: number; created_at: string; updated_at: string;
  tags: { id: number; tag: string }[];
  files: { id: number; filename: string; s3_key: string; content_type: string; size_bytes: number; created_at: string }[];
  mermaid: { id: number; title: string; content: string; created_at: string; updated_at: string }[];
}

export interface User {
  id: string; name: string; email: string;
  role: "admin" | "architect" | "analyst" | "observer";
  department: string; status: "active" | "inactive" | "blocked";
  last_login: string | null; created_at: string; updated_at: string;
}

export interface DashboardStats {
  requirements: number; architectures: number; templates: number;
  active_users: number; technologies: number; org_domains: number; tech_domains: number;
  req_by_severity: Record<string, number>;
  arch_by_status: Record<string, number>;
  req_by_status: Record<string, number>;
}

// ── Requirements ─────────────────────────────────────────────────────────────
export const requirementsApi = {
  list: (p?: { search?: string; category?: string; severity?: string; status?: string }) =>
    api.get<Requirement[]>("/requirements", p as Record<string, string>),
  get:    (id: string) => api.get<Requirement>(`/requirements/${id}`),
  create: (b: Partial<Requirement>) => api.post<Requirement>("/requirements", b),
  update: (id: string, b: Partial<Requirement>) => api.put<Requirement>(`/requirements/${id}`, b),
  remove: (id: string) => api.delete(`/requirements/${id}`),
  stats:  () => api.get<Record<string, unknown>>("/requirements/stats/summary"),
  addComment: (id: string, text: string) => api.post(`/requirements/${id}/comments`, { text }),
  deleteComment: (id: string, cid: number) => api.delete(`/requirements/${id}/comments/${cid}`),
};

// ── Architectures ─────────────────────────────────────────────────────────────
export const architecturesApi = {
  list:   (p?: { search?: string; status?: string }) => api.get<Architecture[]>("/architectures", p as Record<string, string>),
  get:    (id: string) => api.get<Architecture>(`/architectures/${id}`),
  create: (b: Partial<Architecture>) => api.post<Architecture>("/architectures", b),
  update: (id: string, b: Partial<Architecture> & { tags?: string[] }) => api.put<Architecture>(`/architectures/${id}`, b),
  remove: (id: string) => api.delete(`/architectures/${id}`),
  stats:  () => api.get<Record<string, unknown>>("/architectures/stats/summary"),
};

// ── Templates ─────────────────────────────────────────────────────────────────
export const templatesApi = {
  list:   (p?: { search?: string; category?: string }) => api.get<Template[]>("/templates", p as Record<string, string>),
  get:    (id: string) => api.get<Template>(`/templates/${id}`),
  create: (b: Partial<Template> & { compliance?: string[] }) => api.post<Template>("/templates", b),
  update: (id: string, b: Partial<Template> & { compliance?: string[] }) => api.put<Template>(`/templates/${id}`, b),
  remove: (id: string) => api.delete(`/templates/${id}`),
  apply:  (id: string) => api.post<{ used_count: number }>(`/templates/${id}/apply`),
};

// ── Org Domains ───────────────────────────────────────────────────────────────
export const orgDomainsApi = {
  list:   (p?: { search?: string; status?: string }) => api.get<OrgDomain[]>("/org-domains", p as Record<string, string>),
  get:    (id: string) => api.get<OrgDomain>(`/org-domains/${id}`),
  create: (b: Partial<OrgDomain>) => api.post<OrgDomain>("/org-domains", b),
  update: (id: string, b: Partial<OrgDomain>) => api.put<OrgDomain>(`/org-domains/${id}`, b),
  remove: (id: string) => api.delete(`/org-domains/${id}`),
};

// ── Tech Domains ──────────────────────────────────────────────────────────────
export const techDomainsApi = {
  list:   (p?: { search?: string; status?: string }) => api.get<TechDomain[]>("/tech-domains", p as Record<string, string>),
  get:    (id: string) => api.get<TechDomain>(`/tech-domains/${id}`),
  create: (b: Partial<TechDomain> & { org_domain_ids?: string[] }) => api.post<TechDomain>("/tech-domains", b),
  update: (id: string, b: Partial<TechDomain> & { org_domain_ids?: string[] }) => api.put<TechDomain>(`/tech-domains/${id}`, b),
  remove: (id: string) => api.delete(`/tech-domains/${id}`),
};

// ── Technologies ──────────────────────────────────────────────────────────────
export const technologiesApi = {
  list:    (p?: { search?: string; status?: string }) => api.get<Technology[]>("/technologies", p as Record<string, string>),
  get:     (id: string) => api.get<Technology>(`/technologies/${id}`),
  create:  (b: Partial<Technology> & { tags?: string[] }) => api.post<Technology>("/technologies", b),
  update:  (id: string, b: Partial<Technology> & { tags?: string[] }) => api.put<Technology>(`/technologies/${id}`, b),
  remove:  (id: string) => api.delete(`/technologies/${id}`),
  allTags: () => api.get<string[]>("/technologies/tags/all"),
  addTag:    (id: string, tag: string) => api.post(`/technologies/${id}/tags?tag=${encodeURIComponent(tag)}`),
  removeTag: (id: string, tagId: number) => api.delete(`/technologies/${id}/tags/${tagId}`),
  addMermaid:    (id: string, title: string, content: string) => api.post(`/technologies/${id}/mermaid`, { title, content }),
  updateMermaid: (id: string, mid: number, title: string, content: string) => api.put(`/technologies/${id}/mermaid/${mid}`, { title, content }),
  deleteMermaid: (id: string, mid: number) => api.delete(`/technologies/${id}/mermaid/${mid}`),
  uploadFile: (id: string, filename: string, content_type: string, file_base64: string) =>
    api.post(`/technologies/${id}/files`, { filename, content_type, file_base64 }),
  deleteFile: (id: string, fileId: number) => api.delete(`/technologies/${id}/files/${fileId}`),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  list:   (p?: { search?: string; role?: string; status?: string }) => api.get<User[]>("/users", p as Record<string, string>),
  get:    (id: string) => api.get<User>(`/users/${id}`),
  create: (b: Partial<User> & { password?: string }) => api.post<User>("/users", b),
  update: (id: string, b: Partial<User>) => api.put<User>(`/users/${id}`, b),
  remove: (id: string) => api.delete(`/users/${id}`),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  stats: () => api.get<DashboardStats>("/dashboard/stats"),
};
