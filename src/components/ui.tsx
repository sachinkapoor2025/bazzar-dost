import { cn } from "@/lib/format";

const variants = {
  primary: "bg-forest-800 text-cream-50 hover:bg-forest-700",
  gold: "bg-gold-400 text-forest-900 hover:bg-gold-300",
  outline: "border border-forest-800 bg-transparent text-forest-800 hover:bg-forest-800 hover:text-cream-50",
  ghost: "bg-transparent text-forest-800 hover:bg-cream-200",
  cream: "border border-cream-100 bg-transparent text-cream-50 hover:bg-cream-50 hover:text-forest-900",
  danger: "bg-transparent text-[#7F1D1D] hover:bg-[#F8E8E8]",
};

export function buttonClass(variant: keyof typeof variants = "primary", className?: string) {
  return cn(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2 text-center text-sm font-semibold transition motion-safe:duration-200 disabled:cursor-not-allowed disabled:opacity-50",
    variants[variant],
    className,
  );
}

export const fieldClass =
  "min-h-11 w-full rounded-xl border border-cream-300 bg-white px-3 text-sm text-ink outline-none placeholder:text-muted/70";

export const labelClass = "mb-1 block text-sm font-semibold text-ink";

export function Container({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-page px-4", className)}>{children}</div>;
}

export function SectionTitle({
  id,
  eyebrow,
  title,
  action,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-700">{eyebrow}</p> : null}
        <h2 id={id} className="font-display text-3xl leading-tight text-forest-900">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}
