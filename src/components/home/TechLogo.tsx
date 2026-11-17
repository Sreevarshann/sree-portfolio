import type { Tech } from "@/content/technologies";

/** A technology mark: sprite symbol, standalone SVG file, or typographic tile. */
export function TechLogo({ tech }: { tech: Tech }) {
  const { logo } = tech;
  if (logo.kind === "sprite") {
    const ink = (c: string | undefined) => (c === "ink" ? "var(--fg)" : c);
    return (
      <svg
        className="tech-logo"
        viewBox="0 0 24 24"
        width="24"
        height="24"
        aria-hidden="true"
        fill="currentColor"
        style={{
          ["--cl" as string]: ink(logo.color),
          ["--cd" as string]: ink(logo.darkColor ?? logo.color),
          // The official JavaScript mark: black letters through a yellow square.
          ...(logo.backdrop ? { background: `linear-gradient(${logo.backdrop}, ${logo.backdrop}) center / 86% 86% no-repeat` } : {}),
        }}
      >
        <use href={`/tech-icons.svg#${logo.id}`} />
      </svg>
    );
  }
  if (logo.kind === "file") {
    // Tiny static SVGs (next/image adds nothing). Eager: lazy loading would
    // wait until a logo slides in from the edge and make it pop in.
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="tech-logo" src={logo.src} alt="" width={24} height={24} decoding="async" />;
  }
  return (
    <span className="tech-logo tech-logo-text" aria-hidden="true">
      {logo.mark}
    </span>
  );
}

