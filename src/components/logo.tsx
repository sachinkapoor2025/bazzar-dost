import Link from "next/link";

export function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const word = tone === "light" ? "text-cream-50" : "text-forest-900";
  return (
    <Link href="/" className="inline-flex items-center gap-2 rounded-full" aria-label="BazaarDost home">
      <svg viewBox="0 0 64 64" className="h-9 w-9" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill="#1B4332" />
        <path d="M12 34h40l-4 16H16z" fill="#E8B84A" />
        <path d="M16 34c3-10 8-10 11 0c3-10 8-10 11 0c3-10 8-10 11 0" fill="none" stroke="#FBF8F3" strokeWidth="3" />
      </svg>
      <span className={`font-display text-[1.35rem] leading-none ${word}`}>
        Bazaar<span className="text-gold-500">Dost</span>
      </span>
    </Link>
  );
}
