import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import Icon from "@/components/ui/icon";
import ConfirmDeleteDialog from "@/components/ui/confirm-delete-dialog";
import { technologiesApi, type TechDetail } from "@/api/technologies";
import { userStore } from "@/data/userStore";

const STATUS_OPTIONS = [
  { value: "active",   label: "Активен" },
  { value: "dev",      label: "В разработке" },
  { value: "inactive", label: "Не активен" },
  { value: "archived", label: "В архиве" },
] as const;

const STATUS_META: Record<string, { label: string; color: string }> = {
  active:   { label: "Активен",      color: "var(--success)" },
  dev:      { label: "В разработке", color: "var(--amber)" },
  inactive: { label: "Не активен",   color: "var(--text-dim)" },
  archived: { label: "В архиве",     color: "var(--steel)" },
};

// ── Mermaid рендерер ────────────────────────────────────────────────────────
function MermaidDiagram({ content }: { content: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || !content.trim()) return;
    import("mermaid").then(({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, theme: "dark" });
      const id = `mmd-${Math.random().toString(36).slice(2)}`;
      mermaid.render(id, content).then(({ svg }) => {
        if (ref.current) ref.current.innerHTML = svg;
      }).catch(() => {
        if (ref.current) ref.current.innerHTML = `<p class="text-danger text-xs">Ошибка синтаксиса Mermaid</p>`;
      });
    });
  }, [content]);
  return <div ref={ref} className="overflow-auto" />;
}

export default function TechnologyCard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isAdmin = userStore.get().role === "admin";

  const [tech, setTech] = useState<TechDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "files" | "mermaid">("info");
  const [mdPreview, setMdPreview] = useState(false);

  // form state
  const [form, setForm] = useState({ name: "", owner: "", status: "active", description: "" });

  // tags
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // mermaid editor
  const [mermaidTitle, setMermaidTitle] = useState("Схема");
  const [mermaidContent, setMermaidContent] = useState("graph TD\n  A --> B");
  const [mermaidEditId, setMermaidEditId] = useState<number | null>(null);
  const [mermaidPreview, setMermaidPreview] = useState(false);

  // file upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const data = await technologiesApi.get(id);
    setTech(data);
    setForm({ name: data.name, owner: data.owner, status: data.status, description: data.description });
    setDirty(false);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    technologiesApi.allTags().then(setAllTags).catch(() => {});
  }, []);

  const change = (key: keyof typeof form, value: string) => {
    setForm(p => ({ ...p, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!id || !dirty) return;
    setSaving(true);
    await technologiesApi.update(id, { ...form, tags: tech?.tags.map(t => t.tag) ?? [] });
    await load();
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    await technologiesApi.remove(id);
    navigate("/technologies");
  };

  // ── Tags ──────────────────────────────────────────────────────────────────
  const handleTagInput = (v: string) => {
    setTagInput(v);
    if (v.trim().length > 0) {
      const existing = tech?.tags.map(t => t.tag) ?? [];
      setTagSuggestions(allTags.filter(t => t.toLowerCase().includes(v.toLowerCase()) && !existing.includes(t)));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const addTag = async (tag: string) => {
    if (!id || !tag.trim()) return;
    const trimmed = tag.trim();
    const existing = tech?.tags.map(t => t.tag) ?? [];
    if (existing.includes(trimmed)) { setTagInput(""); setShowSuggestions(false); return; }
    await technologiesApi.addTag(id, trimmed);
    setTagInput("");
    setShowSuggestions(false);
    load();
    if (!allTags.includes(trimmed)) setAllTags(p => [...p, trimmed].sort());
  };

  const removeTag = async (tagId: number) => {
    await technologiesApi.removeTag(tagId);
    load();
  };

  // ── Mermaid ───────────────────────────────────────────────────────────────
  const saveMermaid = async () => {
    if (!id) return;
    if (mermaidEditId !== null) {
      await technologiesApi.updateMermaid(mermaidEditId, mermaidTitle, mermaidContent);
    } else {
      await technologiesApi.addMermaid(id, mermaidTitle, mermaidContent);
    }
    setMermaidEditId(null);
    setMermaidTitle("Схема");
    setMermaidContent("graph TD\n  A --> B");
    load();
  };

  const deleteMermaid = async (mId: number) => {
    await technologiesApi.deleteMermaid(mId);
    load();
  };

  // ── Files ─────────────────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploading(true);
    const buf = await file.arrayBuffer();
    const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
    await technologiesApi.uploadFile(id, file.name, file.type || "application/octet-stream", b64);
    setUploading(false);
    load();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const deleteFile = async (fileId: number) => {
    await technologiesApi.deleteFile(fileId);
    load();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full text-dim">
      <Icon name="Loader" size={24} className="animate-spin mr-2" />
      Загрузка...
    </div>
  );

  if (!tech) return (
    <div className="flex flex-col items-center justify-center h-full text-dim">
      <Icon name="AlertCircle" size={32} className="mb-3 opacity-40" />
      <p className="text-sm">Технология не найдена</p>
      <button onClick={() => navigate("/technologies")} className="mt-4 text-xs text-steel hover:underline">
        ← Вернуться к списку
      </button>
    </div>
  );

  const statusMeta = STATUS_META[tech.status] ?? STATUS_META.inactive;

  return (
    <div className="flex flex-col h-full">
      <ConfirmDeleteDialog
        open={deleteOpen}
        title={tech.name}
        description="Технология будет удалена из реестра."
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-5">
        <button onClick={() => navigate("/technologies")} className="text-sec hover:text-foreground transition-colors flex items-center gap-1">
          <Icon name="ChevronLeft" size={14} />
          Технологии
        </button>
        <Icon name="ChevronRight" size={13} className="text-dim" />
        <span className="font-mono text-xs text-steel">{tech.id}</span>
        <span className="tag-info">v{tech.version}</span>
        <span className="flex items-center gap-1 text-xs" style={{ color: statusMeta.color }}>
          <span className="status-dot" style={{ background: statusMeta.color }} />
          {statusMeta.label}
        </span>
        {dirty && <span className="tag-medium">Несохранено</span>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-line">
        {([["info", "Основное", "Info"], ["files", "Файлы", "Paperclip"], ["mermaid", "Схемы", "GitBranch"]] as const).map(([tab, label, icon]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-amber text-amber font-medium"
                : "border-transparent text-sec hover:text-foreground"
            }`}
          >
            <Icon name={icon} size={14} />
            {label}
            {tab === "files" && tech.files.length > 0 && (
              <span className="ml-1 text-xs bg-surface-2 text-dim rounded px-1">{tech.files.length}</span>
            )}
            {tab === "mermaid" && tech.mermaid.length > 0 && (
              <span className="ml-1 text-xs bg-surface-2 text-dim rounded px-1">{tech.mermaid.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">

        {/* ── TAB: Основное ─────────────────────────────────────────────────── */}
        {activeTab === "info" && (
          <div className="max-w-2xl space-y-5">
            {/* ID */}
            <div>
              <label className="text-xs text-dim block mb-1.5 uppercase tracking-wider">ID</label>
              <div className="px-3 py-2 bg-surface-1 border border-line rounded text-sm font-mono text-dim select-all cursor-default">
                {tech.id}
              </div>
            </div>

            {/* Название */}
            <div>
              <label className="text-xs text-dim block mb-1.5 uppercase tracking-wider">Название</label>
              <input
                className="w-full px-3 py-2 bg-surface-1 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50 transition-colors"
                value={form.name}
                onChange={e => change("name", e.target.value)}
                placeholder="Название технологии"
              />
            </div>

            {/* Версия */}
            <div>
              <label className="text-xs text-dim block mb-1.5 uppercase tracking-wider">Версия</label>
              <div className="flex items-center gap-3">
                <div className="px-3 py-2 bg-surface-1 border border-line rounded text-sm font-mono text-steel cursor-default">
                  v{tech.version}{dirty && <span className="text-amber"> → v{tech.version + 1}</span>}
                </div>
                <p className="text-xs text-dim">Увеличивается автоматически при сохранении</p>
              </div>
            </div>

            {/* Владелец */}
            <div>
              <label className="text-xs text-dim block mb-1.5 uppercase tracking-wider">Владелец</label>
              <input
                className="w-full px-3 py-2 bg-surface-1 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50 transition-colors"
                value={form.owner}
                onChange={e => change("owner", e.target.value)}
                placeholder="ФИО или подразделение"
              />
            </div>

            {/* Статус */}
            <div>
              <label className="text-xs text-dim block mb-1.5 uppercase tracking-wider">Статус</label>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    onClick={() => change("status", o.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded border text-sm transition-all ${
                      form.status === o.value
                        ? "border-amber/50 bg-amber/10"
                        : "border-line bg-surface-1 hover:border-amber/20"
                    }`}
                  >
                    <span className="status-dot shrink-0" style={{ background: STATUS_META[o.value].color }} />
                    <span className={form.status === o.value ? "text-amber font-medium" : "text-sec"}>{o.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Теги */}
            <div>
              <label className="text-xs text-dim block mb-1.5 uppercase tracking-wider">Теги</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tech.tags.map(t => (
                  <span key={t.id} className="flex items-center gap-1 tag-info pr-1">
                    {t.tag}
                    <button onClick={() => removeTag(t.id)} className="text-dim hover:text-danger transition-colors ml-0.5">
                      <Icon name="X" size={11} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="relative">
                <input
                  className="w-full px-3 py-2 bg-surface-1 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50 transition-colors"
                  placeholder="Добавить тег..."
                  value={tagInput}
                  onChange={e => handleTagInput(e.target.value)}
                  onFocus={() => tagInput && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onKeyDown={e => {
                    if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); }
                    if (e.key === "," || e.key === " ") { e.preventDefault(); addTag(tagInput); }
                  }}
                />
                {showSuggestions && tagSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-surface-1 border border-line rounded shadow-xl overflow-hidden">
                    {tagSuggestions.slice(0, 8).map(tag => (
                      <button
                        key={tag}
                        onMouseDown={() => addTag(tag)}
                        className="w-full text-left px-3 py-2 text-sm text-sec hover:bg-surface-2 hover:text-foreground transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-dim mt-1">Enter или запятая для добавления</p>
            </div>

            {/* Описание */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-dim uppercase tracking-wider">Описание</label>
                <button
                  onClick={() => setMdPreview(p => !p)}
                  className="flex items-center gap-1 text-xs text-dim hover:text-amber transition-colors"
                >
                  <Icon name={mdPreview ? "Edit" : "Eye"} size={12} />
                  {mdPreview ? "Редактировать" : "Просмотр"}
                </button>
              </div>
              {mdPreview ? (
                <div className="min-h-40 px-4 py-3 bg-surface-1 border border-line rounded prose prose-invert prose-sm max-w-none text-foreground">
                  <ReactMarkdown>{form.description || "_Описание пустое_"}</ReactMarkdown>
                </div>
              ) : (
                <textarea
                  className="w-full px-3 py-2 bg-surface-1 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50 transition-colors resize-none font-mono"
                  rows={10}
                  value={form.description}
                  onChange={e => change("description", e.target.value)}
                  placeholder="Описание в формате Markdown..."
                />
              )}
            </div>

            <div className="text-xs text-dim pt-2 border-t border-line">
              Последнее обновление: <span className="font-mono">
                {new Date(tech.updated_at).toLocaleString("ru-RU")}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pb-6">
              <button
                onClick={handleSave}
                disabled={!dirty || saving}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium rounded bg-amber text-primary-foreground hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Icon name="Save" size={14} />
                {saving ? "Сохранение..." : `Сохранить${dirty ? ` (v${tech.version + 1})` : ""}`}
              </button>
              <button
                onClick={() => { setForm({ name: tech.name, owner: tech.owner, status: tech.status, description: tech.description }); setDirty(false); }}
                disabled={!dirty}
                className="px-4 py-2 text-sm bg-surface-1 border border-line rounded text-sec hover:text-foreground hover:border-amber/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Сбросить
              </button>
              {isAdmin ? (
                <button
                  onClick={() => setDeleteOpen(true)}
                  className="ml-auto px-4 py-2 text-sm bg-surface-1 border border-line rounded text-dim hover:text-danger hover:border-danger/30 transition-colors flex items-center gap-2"
                >
                  <Icon name="Trash2" size={14} />
                  Удалить
                </button>
              ) : (
                <div className="ml-auto flex items-center gap-1.5 text-xs text-dim px-3">
                  <Icon name="Lock" size={12} />
                  Удаление доступно только администратору
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: Файлы ────────────────────────────────────────────────────── */}
        {activeTab === "files" && (
          <div className="max-w-2xl space-y-4">
            <div
              className="border-2 border-dashed border-line rounded-lg p-8 text-center cursor-pointer hover:border-amber/40 transition-colors group"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) {
                  const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
                  handleFileUpload(fakeEvent);
                }
              }}
            >
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
              {uploading ? (
                <div className="flex items-center justify-center gap-2 text-dim">
                  <Icon name="Loader" size={20} className="animate-spin" />
                  Загрузка...
                </div>
              ) : (
                <>
                  <Icon name="Upload" size={28} className="mx-auto mb-2 text-dim group-hover:text-amber transition-colors" />
                  <p className="text-sm text-sec group-hover:text-foreground transition-colors">
                    Перетащите файл или нажмите для выбора
                  </p>
                  <p className="text-xs text-dim mt-1">Любой тип файлов</p>
                </>
              )}
            </div>

            {tech.files.length === 0 ? (
              <div className="text-center py-8 text-dim text-sm">
                <Icon name="Paperclip" size={24} className="mx-auto mb-2 opacity-40" />
                Файлы не прикреплены
              </div>
            ) : (
              <div className="space-y-2">
                {tech.files.map(f => (
                  <div key={f.id} className="flex items-center gap-3 bg-surface-1 border border-line rounded px-4 py-3">
                    <Icon name="File" size={16} className="text-steel shrink-0" />
                    <div className="flex-1 min-w-0">
                      <a
                        href={f.s3_key}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-foreground hover:text-amber transition-colors truncate block"
                      >
                        {f.filename}
                      </a>
                      <p className="text-xs text-dim mt-0.5">
                        {f.content_type} · {(f.size_bytes / 1024).toFixed(1)} KB ·{" "}
                        {new Date(f.created_at).toLocaleString("ru-RU")}
                      </p>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => deleteFile(f.id)}
                        className="text-dim hover:text-danger transition-colors"
                        title="Удалить файл"
                      >
                        <Icon name="Trash2" size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Mermaid схемы ────────────────────────────────────────────── */}
        {activeTab === "mermaid" && (
          <div className="space-y-5">
            {/* Editor */}
            <div className="max-w-2xl bg-surface-1 border border-line rounded p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                {mermaidEditId !== null ? "Редактирование схемы" : "Новая схема"}
              </h3>
              <div className="space-y-3">
                <input
                  className="w-full px-3 py-2 bg-surface-2 border border-line rounded text-sm text-foreground focus:outline-none focus:border-amber/50 transition-colors"
                  placeholder="Название схемы"
                  value={mermaidTitle}
                  onChange={e => setMermaidTitle(e.target.value)}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-dim">Mermaid код</span>
                  <button
                    onClick={() => setMermaidPreview(p => !p)}
                    className="flex items-center gap-1 text-xs text-dim hover:text-amber transition-colors"
                  >
                    <Icon name={mermaidPreview ? "Code" : "Eye"} size={12} />
                    {mermaidPreview ? "Код" : "Предпросмотр"}
                  </button>
                </div>
                {mermaidPreview ? (
                  <div className="bg-surface-2 border border-line rounded p-4 min-h-32">
                    <MermaidDiagram content={mermaidContent} />
                  </div>
                ) : (
                  <textarea
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded text-sm text-foreground font-mono focus:outline-none focus:border-amber/50 transition-colors resize-none"
                    rows={8}
                    value={mermaidContent}
                    onChange={e => setMermaidContent(e.target.value)}
                    placeholder="graph TD&#10;  A[Начало] --> B[Конец]"
                  />
                )}
                <div className="flex gap-2">
                  <button
                    onClick={saveMermaid}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-amber text-primary-foreground rounded font-medium hover:opacity-90 transition-opacity"
                  >
                    <Icon name="Save" size={13} />
                    {mermaidEditId !== null ? "Обновить" : "Сохранить"}
                  </button>
                  {mermaidEditId !== null && (
                    <button
                      onClick={() => { setMermaidEditId(null); setMermaidTitle("Схема"); setMermaidContent("graph TD\n  A --> B"); }}
                      className="px-4 py-2 text-sm bg-surface-2 border border-line rounded text-sec hover:text-foreground transition-colors"
                    >
                      Отмена
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* List of diagrams */}
            {tech.mermaid.length === 0 ? (
              <div className="text-center py-8 text-dim text-sm max-w-2xl">
                <Icon name="GitBranch" size={24} className="mx-auto mb-2 opacity-40" />
                Схемы не добавлены
              </div>
            ) : (
              <div className="space-y-4">
                {tech.mermaid.map(m => (
                  <div key={m.id} className="bg-surface-1 border border-line rounded p-4 max-w-3xl">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-foreground">{m.title}</h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setMermaidEditId(m.id); setMermaidTitle(m.title); setMermaidContent(m.content); }}
                          className="text-dim hover:text-amber transition-colors"
                          title="Редактировать"
                        >
                          <Icon name="Edit" size={14} />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => deleteMermaid(m.id)}
                            className="text-dim hover:text-danger transition-colors"
                            title="Удалить"
                          >
                            <Icon name="Trash2" size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    <MermaidDiagram content={m.content} />
                    <p className="text-xs text-dim mt-2">
                      Обновлена: {new Date(m.updated_at).toLocaleString("ru-RU")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
