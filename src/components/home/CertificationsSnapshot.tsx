import { certifications } from "@/content/credentials";
import { BrandIcon } from "@/components/ui/BrandIcon";

/**
 * Homepage certifications: one compact card per verified credential, from
 * the same records as /certifications. Each shows the issuer's mark, the
 * credential, the issuer, what kind of credential it is (a training course is
 * never presented as an exam certification) and its verification link. No
 * dates are shown: none are recorded in the verified data.
 */
export function CertificationsSnapshot() {
  return (
    <ul className="cert-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
      {certifications.map((c, i) => {
        const href = c.credentialUrl ?? c.verifyUrl;
        const external = /^https?:/.test(href);
        return (
          <li key={c.name} className="flex min-w-0" data-reveal style={{ ["--i" as string]: i } as React.CSSProperties}>
            <article aria-labelledby={`cert-${i}`} className="cert-card panel group relative flex w-full min-w-0 flex-col p-5 md:p-6">
              <div className="flex items-start gap-4">
                <span className="cert-mark flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" aria-hidden="true">
                  {c.issuerIcon ? <BrandIcon name={c.issuerIcon} size={22} /> : <span className="text-[0.95rem] font-semibold lowercase tracking-[-0.04em]">{c.issuerMark}</span>}
                </span>
                <span className="min-w-0">
                  <h3 id={`cert-${i}`} className="text-[1.05rem] font-medium leading-snug tracking-[-0.02em] text-fg">
                    {c.name}
                  </h3>
                  <p className="mt-1 text-[0.86rem] text-fg-soft">{c.issuer}</p>
                </span>
              </div>
              <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                <span className="chip !py-1 text-[0.7rem]">{c.kind}</span>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cert-link inline-flex items-center gap-1 text-sm font-medium text-accent-fg after:absolute after:inset-0 after:rounded-[inherit]"
                >
                  {c.credentialUrl ? "Verify" : "View"} <span aria-hidden="true">↗</span>
                  <span className="sr-only">
                    {" "}
                    {c.name}
                    {external ? " (opens in a new tab)" : ""}
                  </span>
                </a>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
