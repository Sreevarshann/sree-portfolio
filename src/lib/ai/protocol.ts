/** Newline-delimited JSON events streamed from /api/chat to the client. */
export type ChatSource = { title: string; href: string; section: string; id?: string };

/** A portfolio page offered when no AI answer could be written. */
export type ChatLink = { title: string; href: string; blurb: string };

/**
 * Why the assistant answered with links instead of a written reply.
 * - `unavailable`: the model provider could not be reached (or isn't configured)
 * - `busy`: the provider is rate limited or overloaded; retrying soon usually works
 * - `budget`: the site's daily answer budget is used up
 */
export type FallbackReason = "unavailable" | "busy" | "budget";

/** A source the answer may cite by id ("S2"); href is allowlisted server-side. */
export type SourceRef = { id: string; label: string; href: string };

export type StreamEvent =
  /** Sent first: the sources this answer may cite, by id. */
  | { type: "sourceMap"; items: SourceRef[] }
  | { type: "delta"; text: string }
  /** Sources the answer actually cited (by marker), once it is complete. */
  | { type: "sources"; sources: ChatSource[] }
  | { type: "suggestions"; items: string[] }
  | { type: "fallback"; reason: FallbackReason; links: ChatLink[] }
  | { type: "error"; message: string; code?: string }
  | { type: "done" };

/** Starter prompts in Quick View: who he is, what he built, results, contact. */
export const SUGGESTED_QUESTIONS = ["Who is Sree?", "What has he built?", "What are his biggest achievements?", "How can I contact him?"] as const;

/** Starter prompts in Detailed View: engineering depth. */
export const DETAILED_QUESTIONS = [
  "Explain his Snowflake Cortex AI agent work",
  "Walk me through the AEGIS AI architecture",
  "Compare his AI projects",
  "What engineering decisions shaped SourceAtlas?",
] as const;

/** Extra prompts on the full-page view (no overlap with either starter set). */
export const MORE_QUESTIONS = [
  "What did he build at RightRev?",
  "What did he achieve at the Singapore AUV Challenge?",
  "What are his strongest technical skills?",
  "What is Charlie?",
  "What certifications does he have?",
  "What is he studying at Northeastern?",
] as const;
