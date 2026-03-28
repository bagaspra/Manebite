type Tool = "shadowing" | "keigo" | "hongocut";

const config: Record<Tool, { label: string; className: string }> = {
  shadowing: {
    label: "Shadowing Queue",
    className: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  keigo: {
    label: "Keigo Translator",
    className: "border border-violet-200 bg-violet-50 text-violet-700",
  },
  hongocut: {
    label: "HongoCut",
    className: "border border-amber-200 bg-amber-50 text-amber-700",
  },
};

export default function ToolPill({ tool }: { tool: Tool }) {
  const { label, className } = config[tool];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
