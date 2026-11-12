/** Newline-delimited JSON events streamed from /api/chat to the client. */
export type ChatSource = { title: string; href: string; section: string };

export type StreamEvent =
  | { type: "sources"; sources: ChatSource[] }
  | { type: "delta"; text: string }
  | { type: "fallback"; text: string; sources: ChatSource[] }
  | { type: "error"; message: string; code?: string }
  | { type: "done" };

/** The four starter prompts shown when the assistant opens. */
export const SUGGESTED_QUESTIONS = ["Who is Sree?", "What has he built?", "What did he do at RightRev?", "Why work with Sree?"] as const;

/** Extra prompts offered on the full-page view. */
export const MORE_QUESTIONS = [
  "Explain his Snowflake AI agent work",
  "Tell me about the Singapore AUV Challenge",
  "What did Charlie win at the Google MLOps Expo?",
  "What are Sree's certifications?",
  "What experience does he have with Python and data engineering?",
  "How can I contact Sree?",
] as const;
