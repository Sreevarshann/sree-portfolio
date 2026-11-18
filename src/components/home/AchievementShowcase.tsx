import Link from "next/link";
import { achievements } from "@/content/credentials";
import { RankCounter } from "@/components/achievements/RankCounter";
import { TeamField, RecognitionEmblem } from "@/components/achievements/FieldViz";
import { LinkedInProof } from "@/components/ui/LinkedInProof";

const RANK = "ach-rank rank-reveal text-[clamp(4.6rem,9vw,7.5rem)] font-medium leading-[0.8] tracking-[-0.06em]";

/**
 * The two verified competition results, first thing after the hero.
 *
 * Layout: the cards are one pair. Each card is a CSS subgrid spanning the same
 * six rows of the parent grid (rank and graphic, result label, title, project,
 * description, actions), so every row is as tall as the taller card's content
 * and the titles, labels, descriptions and actions line up exactly, whatever
 * the text lengths. On one column the cards simply stack, each with its rows.
 */
export function AchievementShowcase() {
  return (
    <div className="ach-pair grid gap-x-6 gap-y-5 md:grid-cols-2">
      {achievements.map((a, i) => (
        <article
          key={a.slug}
          aria-labelledby={`ach-${a.slug}`}
          className="ach-card panel group relative row-span-6 grid grid-rows-subgrid gap-y-0 overflow-hidden p-7 transition-[border-color,transform] duration-500 hover:-translate-y-1 hover:border-accent md:p-9"
          data-reveal
          style={{ ["--i" as string]: i } as React.CSSProperties}
        >
          {/* Row 1: ranking numeral and graphic, in a shared-height region. */}
          <div className="ach-head flex items-start justify-between gap-4 sm:gap-6">
            {a.stages ? (
              <RankCounter from={parseInt(a.stages[0].value, 10)} to={a.rank.place} suffix={a.rank.suffix} className={RANK} />
            ) : (
              <p className={RANK}>
                <span className="sr-only">{`${a.rank.place}${a.rank.suffix} place`}</span>
                <span aria-hidden="true">{a.rank.place}</span>
                <span aria-hidden="true" className="serif-accent align-top text-[0.32em] text-accent-fg">{a.rank.suffix}</span>
              </p>
            )}
            <div className="ach-viz flex h-[76px] w-[38%] min-w-0 max-w-[200px] shrink items-center justify-center opacity-90 transition-[opacity,transform] duration-500 group-hover:scale-[1.03] group-hover:opacity-100 md:h-[clamp(96px,8.4vw,124px)] md:w-[42%] md:shrink-0">
              <div className="max-h-full w-full">
                {a.stages ? <TeamField total={320} qualified={130} shortlisted={20} place={a.rank.place} cols={20} /> : <RecognitionEmblem event={a.event} place={a.rank.place} suffix={a.rank.suffix} />}
              </div>
            </div>
          </div>
          {/* Row 2: the result line. */}
          <p className="ach-label eyebrow self-end pt-7 text-accent-fg">{a.rank.field ? `${a.result} · of ${a.rank.field}` : a.result}</p>
          {/* Row 3: the event. */}
          <h3 id={`ach-${a.slug}`} className="ach-title pt-3 text-[1.6rem] font-medium leading-tight tracking-[-0.03em]">
            <Link href={`/achievements#${a.slug}`} className="after:absolute after:inset-0 after:z-0 hover:text-accent-fg">
              {a.event}
            </Link>
          </h3>
          {/* Row 4: what was built. */}
          <p className="ach-project pt-1.5 text-fg-soft">{a.project}</p>
          {/* Row 5: one sentence. */}
          <p className="ach-desc max-w-md pt-4 text-[0.95rem] leading-relaxed text-fg-muted">{a.summary}</p>
          {/* Row 6: actions, on a shared baseline. */}
          <div className="ach-actions relative z-[1] flex flex-wrap items-center gap-3 self-end pt-6">
            <span className="inline-flex items-center gap-2 text-sm text-accent-fg" aria-hidden="true">
              Details <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </span>
            {a.proof && <LinkedInProof href={a.proof.href} label={a.proof.label} compact />}
          </div>
        </article>
      ))}
    </div>
  );
}
