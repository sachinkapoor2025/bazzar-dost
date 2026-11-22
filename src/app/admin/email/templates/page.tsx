import { DeleteTemplateButton, TemplateForm } from "@/components/email-template-form";
import { emailTemplates, savedTemplates } from "@/lib/email-marketing";

export default async function TemplatesPage() {
  const saved = await savedTemplates();
  const builtIn = emailTemplates();
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h2 className="font-display text-2xl">Templates</h2>
        <ul className="mt-3 space-y-3">
          {builtIn.map((template) => (
            <li key={template.id} className="rounded-2xl border border-cream-300 bg-white p-4 text-sm">
              <p className="font-semibold">{template.name}</p>
              <p className="mt-1">{template.subject}</p>
              <p className="mt-1 text-muted">{template.message}</p>
            </li>
          ))}
          {saved.map((template) => (
            <li key={template.id} className="rounded-2xl border border-cream-300 bg-white p-4 text-sm">
              <p className="font-semibold">{template.name}</p>
              <p className="mt-1">{template.subject}</p>
              <p className="mt-1 text-muted">{template.message}</p>
              <DeleteTemplateButton id={template.id} />
            </li>
          ))}
        </ul>
      </div>
      <TemplateForm />
    </div>
  );
}
