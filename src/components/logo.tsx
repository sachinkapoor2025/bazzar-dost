import Link from "next/link";

export function Logo({
  size = "header",
}: {
  size?: "header" | "footer";
  tone?: "dark" | "light";
}) {
  const height = size === "footer" ? "h-14 w-auto max-w-[9.5rem] sm:h-16" : "h-16 w-auto max-w-[46vw] sm:h-20 sm:max-w-none";
  return (
    <Link href="/" className="inline-flex shrink-0 items-center" aria-label="BazaarDost home">
      <img src="/logo.png" alt="BazaarDost — Online Shopping Made Easy" className={height} />
    </Link>
  );
}
