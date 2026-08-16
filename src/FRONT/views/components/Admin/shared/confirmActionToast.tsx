import toast from "react-hot-toast";

type ConfirmActionToastOptions = {
  title: string;
  confirmLabel: string;
  onConfirm: () => void;
  confirmColor?: "danger" | "success";
  cancelLabel?: string;
};

const BASE_BUTTON_STYLE: React.CSSProperties = {
  color: "white",
  border: "none",
  padding: "12px 24px",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: "600",
  minWidth: "120px",
  transition: "all 0.2s ease",
};

const CONFIRM_COLORS: Record<
  "danger" | "success",
  { base: string; hover: string }
> = {
  danger: { base: "var(--color-danger-bright)", hover: "var(--color-danger)" },
  success: { base: "var(--color-success-alt-5)", hover: "var(--color-success-alt-4)" },
};

export const showConfirmActionToast = ({
  title,
  confirmLabel,
  onConfirm,
  confirmColor = "danger",
  cancelLabel = "Cancelar",
}: ConfirmActionToastOptions) => {
  const colors = CONFIRM_COLORS[confirmColor];

  toast(
    (t) => (
      <div style={{ textAlign: "center" }}>
        <p
          style={{
            margin: "0 0 16px 0",
            fontSize: "18px",
            fontWeight: "600",
          }}
        >
          {title}
        </p>
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <button
            onClick={() => {
              toast.dismiss(t.id);
              onConfirm();
            }}
            style={{ ...BASE_BUTTON_STYLE, background: colors.base }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = colors.base;
            }}
          >
            {confirmLabel}
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            style={{ ...BASE_BUTTON_STYLE, background: "var(--color-gray-400)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-gray-450)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--color-gray-400)";
            }}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    ),
    {
      duration: Infinity,
      style: {
        minWidth: "350px",
        padding: "24px",
      },
    },
  );
};
