import Link from "next/link";

/** The centred "see everything" action that closes a homepage section. */
export function SectionAction({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <div className="section-action mt-10 flex justify-center md:mt-12" data-reveal>
      <Link href={href} className="btn btn-ghost">
        {children} <span className="arrow" aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
