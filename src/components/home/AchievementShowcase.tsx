import Link from "next/link";
import { achievements } from "@/content/credentials";
import { RankCounter } from "@/components/achievements/RankCounter";
import { TeamField, Podium } from "@/components/achievements/FieldViz";
import { LinkedInProof } from "@/components/ui/LinkedInProof";

const RANK = "ach-rank rank-reveal text-[clamp(4.6rem,9vw,7.5rem)] font-medium leading-[0.8] tracking-[-0.06em]";

/**
 * The two verified competition results, first thing after the hero. Each card
 * leads with its placing (the SAUVC numeral counts down from the size of the
 * field), shows the original field/podium graphic from the Achievements page,
 * and links to the full write-up and the original result post.
 */
export function AchievementShowcase() {
  return (
    <div className="grid gap-5 md:grid-cols-2 md:gap-6">
      {achievements.map((a, i) => (
        <article
          key={a.slug}
          aria-labelledby={`ach-${a.slug}`}
          className="ach-card panel group relative flex flex-col overflow-hidden transition-[border-color,transform] duration-500 hover:-translate-y-1 hover:border-accent"
          data-reveal
          style={{ ["--i" as string]: i } as React.CSSProperties}
        >
          <div className="flex items-start justify-between gap-6 px-7 pt-7 md:px-9 md:pt-9">
            {a.stages ? (
              <RankCounter from={parseInt(a.stages[0].value, 10)} to={a.rank.place} suffix={a.rank.suffix} className={RANK} />
            ) : (
              <p className={RANK}>
                <span className="sr-only">{`${a.rank.place}${a.rank.suffix} place`}</span>
                <span aria-hidden="true">{a.rank.place}</span>
                <span aria-hidden="true" className="serif-accent align-top text-[0.32em] text-accent-fg">{a.rank.suffix}</span>
              </p>
            )}
            <div className="ach-viz mt-1 w-[42%] max-w-[200px] shrink-0 opacity-90 transition-[opacity,transform] duration-500 group-hover:scale-[1.03] group-hover:opacity-100">
              {a.stages ? <TeamField total={320} qualified={130} shortlisted={20} place={a.rank.place} cols={20} /> : <Podium place={a.rank.place} />}
            </div>
          </div>
          <div className="flex flex-1 flex-col px-7 pb-7 pt-7 md:px-9 md:pb-9">
            <p className="eyebrow text-accent-fg">{a.rank.field ? `${a.result} · of ${a.rank.field}` : a.result}</p>
            <h3 id={`ach-${a.slug}`} className="mt-3 text-[1.6rem] font-medium leading-tight tracking-[-0.03em]">
              <Link href={`/achievements#${a.slug}`} className="after:absolute after:inset-0 after:z-0 hover:text-accent-fg">
                {a.event}
              </Link>
            </h3>
            <p className="mt-1.5 text-fg-soft">{a.project}</p>
            <p className="v-detailed mt-4 max-w-md text-[0.95rem] leading-relaxed text-fg-muted">{a.summary}</p>
            <div className="relative z-[1] mt-auto flex flex-wrap items-center gap-3 pt-6">
              <span className="inline-flex items-center gap-2 text-sm text-accent-fg" aria-hidden="true">
                Details <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </span>
              {a.proof && <LinkedInProof href={a.proof.href} label={a.proof.label} compact />}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
