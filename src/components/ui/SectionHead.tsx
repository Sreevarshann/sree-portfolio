import Link from "next/link";
import { KineticText } from "@/components/motion/KineticText";

export function SectionHead({
  index,
  eyebrow,
  title,
  accent,
  href,
  hrefLabel,
}: {
  index: string;
  eyebrow: string;
  title: string;
  accent?: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <>
    <div className="rule-draw -mt-px mb-14 h-px w-full bg-gradient-to-r from-accent via-line-strong to-transparent md:mb-20" aria-hidden="true" />
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="eyebrow flex items-center gap-3" data-reveal>
          <span className="text-accent">{index}</span>
          <span className="h-px w-10 bg-line-strong" aria-hidden="true" />
          {eyebrow}
        </p>
        <KineticText
          as="h2"
          trigger="scroll"
          className="h-section mt-5 max-w-[18ch]"
          segments={accent ? [title + " ", { text: accent, className: "serif-accent text-accent-fg" }] : [title]}
        />
      </div>
      {href && (
        <Link href={href} className="btn btn-ghost shrink-0 self-start md:self-auto" data-reveal>
          {hrefLabel ?? "View all"} <span className="arrow" aria-hidden="true">→</span>
        </Link>
      )}
    </div>
    </>
  );
}
