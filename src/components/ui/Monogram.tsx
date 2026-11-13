/**
 * The SS monogram — Sreevarshan Sathiyamurthy's personal mark. Two capitals
 * set in the site's sans with optical kerning, inside a hairline ring; on
 * hover the letters open up and an accent rule draws in underneath.
 */
export function Monogram({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      className={`ss-mark relative inline-flex shrink-0 items-center justify-center rounded-full ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden="true"
    >
      <span className="ss-letters">SS</span>
      <span className="ss-rule" />
    </span>
  );
}
