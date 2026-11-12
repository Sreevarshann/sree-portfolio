import { iconFor } from "./BrandIcon";

/**
 * Technology tag. Shows the tool's mark when one is available; on hover the
 * mark takes the brand's own color and the chip lifts slightly.
 */
export function TechChip({ name }: { name: string }) {
  const icon = iconFor(name);
  return (
    <span className="tech-chip chip group/tc" style={icon ? ({ ["--brand" as string]: icon.hex } as React.CSSProperties) : undefined}>
      {icon && (
        <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" className="tech-chip-icon shrink-0">
          <path d={icon.path} />
        </svg>
      )}
      {name}
    </span>
  );
}
