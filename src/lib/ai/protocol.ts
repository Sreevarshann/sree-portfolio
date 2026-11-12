/** Newline-delimited JSON events streamed from /api/chat to the client. */
export type ChatSource = { title: string; href: string; section: string };

export type StreamEvent =
  | { type: "sources"; sources: ChatSource[] }
  | { type: "delta"; text: string }
  | { type: "fallback"; text: string; sources: ChatSource[] }
  | { type: "error"; message: string; code?: string }
  | { type: "done" };

export const SUGGESTED_QUESTIONS = [
  "Who is Sree?",
  "What did Sree work on at RightRev?",
  "Explain his Snowflake AI agent work",
  "What are his strongest AI engineering skills?",
  "What projects has Sree recently built?",
  "Tell me about the Singapore AUV Challenge",
  "What did Charlie win at the Google MLOps Expo?",
  "What are Sree's certifications?",
  "What experience does he have with Python and data engineering?",
  "Why might Sree be a good fit for a software engineering role?",
  "How can I contact Sree?",
] as const;
