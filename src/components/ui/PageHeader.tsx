import { KineticText } from "@/components/motion/KineticText";

export function PageHeader({
  index,
  eyebrow,
  title,
  accent,
  lede,
  titleClassName,
  children,
}: {
  index: string;
  eyebrow: string;
  title: string;
  accent?: string;
  lede?: string;
  /** Overrides the default display size, e.g. for long names. */
  titleClassName?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="container-x relative pb-12 pt-36 md:pb-20 md:pt-48">
      <div className="grid-bg pointer-events-none absolute inset-0 -z-10 opacity-60" aria-hidden="true" />
      <p className="eyebrow enter-fade flex items-center gap-3" style={{ ["--enter-delay" as string]: "0s" }}>
        <span className="text-accent">{index}</span>
        <span className="h-px w-10 bg-line-strong" aria-hidden="true" />
        {eyebrow}
      </p>
      <KineticText
        as="h1"
        className={`display mt-6 max-w-[16ch] ${titleClassName ?? "text-[clamp(3rem,10vw,8.5rem)]"}`}
        trigger="css"
        segments={accent ? [title + " ", { text: accent, className: "serif-accent text-accent-fg" }] : [title]}
      />
      {lede && (
        <p className="lede enter-fade mt-8 max-w-2xl" style={{ ["--enter-delay" as string]: "0.5s" }}>
          {lede}
        </p>
      )}
      {children}
    </header>
  );
}
