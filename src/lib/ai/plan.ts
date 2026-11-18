import { analyze, modeOf, type Analysis, type Mode } from "./intent";
import { retrieveConversation, type SkillPins, type Turn } from "./retrieve";
import { looksLikeJobDescription, quickReply, type QuickReply } from "./smalltalk";
import type { KnowledgeChunk } from "./knowledge";
import type { ChatMode } from "./protocol";
import { skillsInText } from "@/lib/skillSearch";

/**
 * How one visitor message will be answered, decided before any model call:
 *
 *   quick  greetings, small talk, navigation and extraction attempts get a
 *          fixed reply (no retrieval, no model, no cost)
 *   model  everything else: retrieved evidence, an answer mode, and whether
 *          the message is a pasted job description
 *
 * Kept separate from the route so the evaluation suite tests the exact
 * routing production uses.
 */
export type AnswerPlan =
  | { kind: "quick"; reply: QuickReply }
  | { kind: "model"; chunks: KnowledgeChunk[]; analysis: Analysis; mode: Mode; jobDescription: boolean };

export function planAnswer(history: Turn[], opts: { mode?: ChatMode; pins?: SkillPins } = {}): AnswerPlan {
  const latest = history[history.length - 1]?.content ?? "";
  const earlier = history.filter((m) => m.role === "user").length - 1;
  const reply = quickReply(latest, earlier);
  if (reply) return { kind: "quick", reply };

  // A pasted job description is answered as a requirements-to-evidence map,
  // with the skills it names pinned as verified evidence.
  const jobDescription = looksLikeJobDescription(latest);
  const pins = opts.pins ?? (jobDescription ? skillsInText(latest) : undefined);
  const { chunks, analysis } = retrieveConversation(history, 6, pins);

  // The answer mode follows the latest question; a bare follow-up inherits only
  // a professional mode, never "private" or "casual" from an earlier turn.
  const own = analyze(latest);
  const inherited = modeOf(analysis);
  const base: Mode = own.intents[0] !== "general" ? modeOf(own) : inherited === "private" || inherited === "casual" ? "facts" : inherited;
  // Recruiter Mode (or a pasted job description) reframes professional answers;
  // private and playful questions keep their own mode.
  const mode: Mode = (opts.mode === "recruiter" || jobDescription) && base !== "private" && base !== "casual" ? "recruiter" : base;
  return { kind: "model", chunks, analysis, mode, jobDescription };
}
