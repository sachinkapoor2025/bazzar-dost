import { Container } from "@/components/ui";

export function Info({ title, lede, children }: { title: string; lede?: string; children: React.ReactNode }) {
  return (
    <Container className="py-8">
      <article className="max-w-3xl">
        <h1 className="font-display text-4xl text-forest-900">{title}</h1>
        {lede ? <p className="mt-3 text-sm leading-7 text-muted">{lede}</p> : null}
        <div className="mt-6 space-y-4 text-sm leading-7">{children}</div>
      </article>
    </Container>
  );
}
