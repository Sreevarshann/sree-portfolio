"use client";

import Link from "next/link";
import { SreeMark } from "@/components/ui/SreeMark";
import { useAskSree } from "./AskSreeProvider";

const picks = [
  "Explain his Snowflake AI agent work",
  "What projects has Sree recently built?",
  "Why might Sree be a good fit for a software engineering role?",
];

export function AskSreePromo() {
  const { send, openChat } = useAskSree();
  return (
    <div className="panel relative overflow-hidden p-8 md:p-14" data-reveal>
      <div className="pointer-events-none absolute -right-24 -top-24 opacity-[0.08] md:opacity-[0.12]" aria-hidden="true">
        <SreeMark size={520} />
      </div>
      <div className="relative grid gap-10 md:grid-cols-[auto_1fr] md:items-center">
        <div className="group">
          <SreeMark size={112} />
        </div>
        <div>
          <p className="eyebrow">Ask Sree · AI assistant</p>
          <h2 className="mt-4 max-w-[20ch] text-[clamp(2rem,4.6vw,3.6rem)] font-medium leading-[1.02] tracking-[-0.04em]">
            Questions? Ask an assistant that <span className="serif-accent text-accent-fg">only knows what&apos;s verified.</span>
          </h2>
          <p className="mt-5 max-w-xl leading-relaxed text-fg-soft">
            Ask Sree answers from the resume, case studies and public repositories on this site, cites the pages it used, and says so when it doesn&apos;t know.
          </p>
        </div>
      </div>
      <ul className="relative mt-10 flex flex-wrap gap-2">
        {picks.map((q) => (
          <li key={q}>
            <button type="button" onClick={() => send(q)} className="rounded-full border border-line px-4 py-2 text-sm text-fg-soft transition-colors hover:border-accent hover:bg-accent-soft hover:text-fg">
              {q}
            </button>
          </li>
        ))}
        <li>
          <button type="button" onClick={() => openChat()} className="rounded-full bg-accent-solid px-4 py-2 text-sm text-white">
            Ask your own →
          </button>
        </li>
        <li>
          <Link href="/ask" className="inline-block rounded-full px-4 py-2 text-sm text-fg-muted hover:text-fg">
            Full-page mode
          </Link>
        </li>
      </ul>
    </div>
  );
}
