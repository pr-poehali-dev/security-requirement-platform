import Icon from "@/components/ui/icon";

interface Props {
  open: boolean;
  title: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDeleteDialog({ open, title, description, onConfirm, onCancel }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Dialog */}
      <div className="relative z-10 w-full max-w-sm mx-4 bg-surface-1 border border-line rounded-lg shadow-2xl animate-fade-in">
        <div className="p-5">
          {/* Icon + Title */}
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "hsl(var(--danger) / 0.15)" }}>
              <Icon name="Trash2" size={18} className="text-danger" />
            </div>
            <div className="pt-1">
              <h3 className="text-sm font-semibold text-foreground">Удалить {title}?</h3>
              {description && (
                <p className="text-xs text-sec mt-1">{description}</p>
              )}
              <p className="text-xs text-dim mt-2">Это действие необратимо.</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm bg-surface-2 border border-line rounded text-sec hover:text-foreground hover:border-amber/20 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium rounded text-white transition-opacity hover:opacity-90"
              style={{ background: "hsl(var(--danger))" }}
            >
              Удалить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
