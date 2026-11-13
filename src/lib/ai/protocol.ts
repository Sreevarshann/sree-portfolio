/** Newline-delimited JSON events streamed from /api/chat to the client. */
export type ChatSource = { title: string; href: string; section: string };

/** A portfolio page offered when no AI answer could be written. */
export type ChatLink = { title: string; href: string; blurb: string };

/**
 * Why the assistant answered with links instead of a written reply.
 * - `unavailable`: the model provider could not be reached (or isn't configured)
 * - `busy`: the provider is rate limited or overloaded; retrying soon usually works
 * - `budget`: the site's daily answer budget is used up
 */
export type FallbackReason = "unavailable" | "busy" | "budget";

export type StreamEvent =
  | { type: "delta"; text: string }
  /** Pages the answer drew on; sent once the answer is complete. */
  | { type: "sources"; sources: ChatSource[] }
  | { type: "suggestions"; items: string[] }
  | { type: "fallback"; reason: FallbackReason; links: ChatLink[] }
  | { type: "error"; message: string; code?: string }
  | { type: "done" };

/** The four starter prompts shown when the assistant opens. */
export const SUGGESTED_QUESTIONS = ["Who is Sree?", "What did he build at RightRev?", "What is his most impressive project?", "What did he achieve at the Singapore AUV Challenge?"] as const;

/** Extra prompts offered on the full-page view. */
export const MORE_QUESTIONS = [
  "Explain his Snowflake Cortex AI agent work",
  "What are his strongest technical skills?",
  "What is Charlie?",
  "What certifications does he have?",
  "What is he studying at Northeastern?",
  "How can I contact him?",
] as const;
