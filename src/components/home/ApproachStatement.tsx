import { InView } from "@/components/motion/InView";

const LEAD = "An AI feature is only as good as";
const HIGHLIGHT = "the data it reads.";

/**
 * "My approach": one compact statement. Words rise in sequence once the
 * section is in view and the key phrase gets an underline; the server markup
 * is the finished state, so it reads instantly without JS or with reduced
 * motion.
 */
export function ApproachStatement() {
  const words = LEAD.split(" ");
  return (
    <InView as="div" className="approach" threshold={0.4}>
      <p className="eyebrow approach-label">My approach</p>
      <h2 className="approach-statement">
        {words.map((w, i) => (
          <span key={i}>
            <span className="approach-word" style={{ ["--w" as string]: i } as React.CSSProperties}>
              {w}
            </span>{" "}
          </span>
        ))}
        <span className="approach-hl approach-word" style={{ ["--w" as string]: words.length } as React.CSSProperties}>
          {HIGHLIGHT}
        </span>
      </h2>
      <p className="approach-support">I focus on reliable data, thoughtful architecture, and systems that work beyond the prototype.</p>
    </InView>
  );
}
