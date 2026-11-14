import { buttonClass } from "@/components/ui";

const certificates = [
  {
    title: "UDYAM Registration Certificate",
    href: "/certificates/udyam-registration-certificate.pdf",
    download: "BazaarDost-UDYAM-Registration-Certificate.pdf",
  },
] as const;

export function RegistrationCertificates() {
  return (
    <section id="certificates" className="mt-10 scroll-mt-24">
      <h2 className="font-display text-3xl text-forest-900">Registration certificates</h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">These are the store’s registration documents. Open a certificate in your browser, or download the file.</p>
      <div className={`mt-4 grid gap-4 ${certificates.length > 1 ? "md:grid-cols-2" : ""}`}>
        {certificates.map((certificate) => (
          <article key={certificate.href} className="flex flex-col overflow-hidden rounded-2xl border border-cream-300 bg-white">
            <h3 className="border-b border-cream-300 px-4 py-3 font-display text-2xl text-forest-900">{certificate.title}</h3>
            <div className="h-80 bg-cream-100 sm:h-[28rem]">
              <iframe title={certificate.title} src={certificate.href} className="h-full w-full" />
            </div>
            <div className="flex flex-wrap gap-2 p-4">
              <a href={certificate.href} target="_blank" rel="noreferrer" className={buttonClass("primary")}>View certificate</a>
              <a href={certificate.href} download={certificate.download} className={buttonClass("outline")}>Download</a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
