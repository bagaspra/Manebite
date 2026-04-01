interface FuriganaToggleProps {
  isActive: boolean;
  onToggle: () => void;
}

export default function FuriganaToggle({ isActive, onToggle }: FuriganaToggleProps) {
  return (
    <button
      onClick={onToggle}
      title={isActive ? "Sembunyikan furigana" : "Tampilkan furigana"}
      className="flex h-6 w-6 items-center justify-center rounded border text-xs font-medium transition-colors"
      style={
        isActive
          ? { background: "var(--accent, #0e7490)", borderColor: "var(--accent, #0e7490)", color: "#fff" }
          : { background: "transparent", borderColor: "#D1D5DB", color: "#9CA3AF" }
      }
    >
      ふ
    </button>
  );
}
