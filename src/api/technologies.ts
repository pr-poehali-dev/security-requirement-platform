const BASE = "https://functions.poehali.dev/99702510-61f0-45c6-aa76-c101517dce96";

export interface TechItem {
  id: string;
  name: string;
  version: number;
  owner: string;
  status: "active" | "dev" | "inactive" | "archived";
  description: string;
  tags: string[];
  updated_at: string;
  created_at: string;
}

export interface TechDetail extends TechItem {
  tags: { id: number; tag: string }[];
  files: { id: number; filename: string; s3_key: string; content_type: string; size_bytes: number; created_at: string }[];
  mermaid: { id: number; title: string; content: string; created_at: string; updated_at: string }[];
}

async function req(method: string, qs: Record<string, string> = {}, body?: unknown) {
  const url = new URL(BASE);
  Object.entries(qs).forEach(([k, v]) => url.searchParams.set(k, v));
  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    return undefined;
  }
  const text = await res.text();
  let data: unknown;
  try { data = JSON.parse(text); } catch { return undefined; }
  if (!res.ok) throw new Error((data as Record<string, string>).error || "Ошибка сервера");
  return data;
}

export const technologiesApi = {
  list: (): Promise<TechItem[]> => req("GET"),
  get: (id: string): Promise<TechDetail> => req("GET", { action: "get", id }),
  create: (data: Partial<TechItem>): Promise<{ id: string }> => req("POST", { action: "create" }, data),
  update: (id: string, data: Partial<TechItem>): Promise<TechItem> => req("PUT", { action: "update", id }, data),
  remove: (id: string): Promise<unknown> => req("DELETE", { action: "delete", id }),

  allTags: (): Promise<string[]> => req("GET", { action: "all_tags" }),
  addTag: (technology_id: string, tag: string) => req("POST", { action: "add_tag" }, { technology_id, tag }),
  removeTag: (tag_id: number) => req("DELETE", { action: "remove_tag", tag_id: String(tag_id) }),

  addMermaid: (technology_id: string, title: string, content: string) =>
    req("POST", { action: "add_mermaid" }, { technology_id, title, content }),
  updateMermaid: (mermaid_id: number, title: string, content: string) =>
    req("PUT", { action: "update_mermaid", mermaid_id: String(mermaid_id) }, { title, content }),
  deleteMermaid: (mermaid_id: number) => req("DELETE", { action: "delete_mermaid", mermaid_id: String(mermaid_id) }),

  uploadFile: (technology_id: string, filename: string, content_type: string, file_base64: string) =>
    req("POST", { action: "upload_file" }, { technology_id, filename, content_type, file_base64 }),
  deleteFile: (file_id: number) => req("DELETE", { action: "delete_file", file_id: String(file_id) }),
};