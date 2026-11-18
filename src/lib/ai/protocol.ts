/**
 * Optional structured context sent with a question. Only canonical catalog ids
 * travel: the server looks up the verified facts itself and ignores unknown ids,
 * so a client cannot supply its own "evidence".
 */
export type ChatContext = { skills?: string[]; topics?: string[] };

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

/** Starter prompts in the welcome state: what he built, his experience, his best projects. */
export const SUGGESTED_QUESTIONS = ["What has Sree built?", "Tell me about his experience", "Show me his best projects"] as const;

/** Extra prompts on the full-page view (no overlap with the starter set). */
export const MORE_QUESTIONS = [
  "Who is Sree?",
  "Can I hire him?",
  "Explain his Snowflake Cortex AI agent work",
  "Which project should I explore first?",
  "Compare AEGIS AI and NEXUS AI",
  "What did he achieve at the Singapore AUV Challenge?",
  "What certifications does he have?",
  "How can I contact him?",
] as const;
