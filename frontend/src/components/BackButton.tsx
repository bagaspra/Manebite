import Link from "next/link";

export default function BackButton({ href, label }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-900"
    >
      ← {label ?? "Back"}
    </Link>
  );
}
