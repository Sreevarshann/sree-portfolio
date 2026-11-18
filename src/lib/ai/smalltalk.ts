import { profile } from "@/content/profile";
import type { SourceRef } from "./protocol";

/**
 * Deterministic replies for messages that need no portfolio evidence and no
 * model call: greetings, small talk, thanks, goodbyes and plain "where is X"
 * navigation requests. They answer instantly, cost nothing, and can never
 * turn "Hi" into a biography.
 *
 * A message only qualifies when ALL of it is small talk. "Hi, can you explain
 * his RightRev work?" is a real question and goes to the model.
 */

export type QuickKind = "greeting" | "wellbeing" | "thanks" | "compliment" | "goodbye" | "navigation" | "guard";
export type QuickReply = { kind: QuickKind; text: string; sourceMap: SourceRef[]; suggestions: string[] };

/** Starter questions offered after a greeting: one per main topic. */
export const STARTERS = ["Who is Sree?", "What has he built?", "What are his biggest achievements?", "How can I contact him?"];

const clean = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’`]/g, "'")
    // Emoji and pictographs carry no request.
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, " ")
    .replace(/[!?.,;:~()"*_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Words that may accompany small talk without making it a question.
const FILLER = "(?:there|all|everyone|folks|friend|buddy|sree ai|sree's ai|ai|bot|assistant|again|so much|a lot|lots|very much|man|mate)";
const GREETING = `(?:hi+|hey+|hello+|hiya|howdy|yo+|sup|wassup|what'?s up|whats up|good (?:morning|afternoon|evening|day)|greetings|hola|namaste|vanakkam|vanakam|heya|hii+)`;
const WELLBEING = `(?:how are you(?: doing)?(?: today)?|how'?s it going|how are things|how do you do|how have you been|you good|how r u|how are u)`;
const THANKS = `(?:thanks?|thank you|thx|ty|cheers|appreciate it|much appreciated|got it|ok(?:ay)?|cool|nice|great|awesome|perfect|sounds good)`;
const COMPLIMENT = `(?:(?:this is (?:a )?)?(?:cool|nice|great|awesome|beautiful|amazing|lovely|sick|clean|slick) (?:website|site|portfolio|page|design)|(?:i )?love (?:the|this|your) (?:website|site|portfolio|design)|(?:the|this|your) (?:website|site|portfolio) (?:is|looks) (?:cool|nice|great|awesome|beautiful|amazing|clean|slick))`;
const GOODBYE = `(?:bye+|goodbye|see you|see ya|later|good ?night|that'?s all|that is all|i'?m done)`;

const whole = (core: string) => new RegExp(`^(?:${GREETING}(?: ${FILLER})* )?${core}(?: ${FILLER})*$`);
const RX = {
  greeting: new RegExp(`^${GREETING}(?: ${FILLER})*(?: ${GREETING}(?: ${FILLER})*)?$`),
  wellbeing: whole(WELLBEING),
  thanks: whole(`${THANKS}(?: ${THANKS})*`),
  compliment: whole(COMPLIMENT),
  goodbye: whole(`(?:${THANKS} )?${GOODBYE}`),
};

/** Stable choice among variants, so replies vary by message but tests stay deterministic. */
function pick<T>(items: T[], seed: string): T {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) | 0;
  return items[Math.abs(h) % items.length];
}

const GREETINGS = [
  "Hey! Welcome to Sree's portfolio. What would you like to explore?",
  "Hi there! Happy to help. Are you curious about Sree's work, his projects, or something else?",
  "Hello! I can walk you through Sree's experience, projects and achievements. Where would you like to start?",
];
const VANAKKAM = "Vanakkam! Welcome to Sree's portfolio. What would you like to explore?";
const WELLBEING_REPLIES = ["Doing well, thanks for asking! What can I help you find?", "All good here, thanks! What would you like to know?"];
const THANKS_REPLIES = ["You're welcome! Anything else you'd like to know?", "Happy to help. Ask away if anything else comes up."];
const COMPLIMENT_REPLIES = ["Glad you like it! There's quite a bit to explore here. Anything that caught your eye?", "Thank you! Sree built it himself. Is there anything you'd like to dig into?"];
const GOODBYE_REPLIES = [`Thanks for stopping by! If you'd like to reach Sree, email is best: ${profile.email}.`, "Take care, and thanks for visiting!"];

/**
 * Requests for the assistant's own instructions or for secrets. Narrow on
 * purpose: "what is a system prompt?" or "how was Sree AI built?" still go to
 * the model.
 */
const EXTRACTION = new RegExp(
  [
    // "reveal / print / show / repeat ... your system prompt / instructions"
    String.raw`\b(reveal|show|print|repeat|output|display|leak|dump|give me|tell me|share|copy|paste|what (are|is|were))\b.{0,40}(\b(your|ur)\s+(system\s+prompt|hidden\s+prompt|initial\s+prompt|instructions|rules|guidelines|configuration|config|prompt)\b|\b(the|this)\s+(system|hidden|initial|developer)\s+(prompt|message|instructions)\b)`,
    // "ignore previous instructions" style overrides
    String.raw`\b(ignore|disregard|forget|override)\b.{0,30}\b(previous|prior|above|all|your|earlier)\b.{0,20}\b(instructions?|prompts?|rules?|guidelines)\b`,
    // secrets
    String.raw`\b(api[\s_-]?keys?|secret\s+keys?|access\s+tokens?|env(ironment)?\s+variables?|\.env\b|credentials?\s+(for|of)\s+(the|this|your)\s+(site|server|api|assistant))\b.{0,40}\b(reveal|show|print|disclose|give|share|leak|tell|what)\b|\b(reveal|show|print|disclose|give|share|leak|tell me)\b.{0,40}\b(api[\s_-]?keys?|secret\s+keys?|access\s+tokens?|env(ironment)?\s+variables?|\.env\b)`,
  ].join("|"),
);

/* ------------------------------------------------------------ navigation */
type Destination = { match: RegExp; label: string; href: string; text: string };

const DESTINATIONS: Destination[] = [
  { match: /^(?:his )?(?:resume|cv|résumé)$/, label: "Resume", href: profile.resumePath, text: "Here's [Sree's resume]({href}). It opens as a PDF you can download." },
  { match: /^(?:his )?(?:projects?|work|portfolio projects?)$/, label: "Projects", href: "/projects", text: "All of Sree's projects, with case studies, are on the [Projects page]({href})." },
  { match: /^(?:his )?(?:certifications?|certificates?|credentials?)$/, label: "Certifications", href: "/certifications", text: "His certifications, with verification links, are on the [Certifications page]({href})." },
  { match: /^(?:his )?(?:experience|work experience|work history|jobs?)$/, label: "Experience", href: "/experience", text: "His full work history is on the [Experience page]({href})." },
  { match: /^(?:his )?(?:achievements?|awards?|competitions?)$/, label: "Achievements", href: "/achievements", text: "His competition results, with photos and proof, are on the [Achievements page]({href})." },
  { match: /^(?:his )?(?:education|degrees?)$/, label: "Education", href: "/education", text: "His degrees are on the [Education page]({href})." },
  { match: /^(?:his )?(?:tech stack|stack|skills|technologies|tools)$/, label: "Tech Stack", href: "/#tools", text: "His tools and technologies, each tied to where he used them, are in the [Tech Stack section]({href})." },
];

const NAV_LEAD = /^(?:(?:can|could) you (?:help me )?(?:find|show(?: me)?|link(?: me)?(?: to)?)|(?:where|how) (?:can|do|could) i (?:see|find|view|get|download|look at)|where(?:'s| is| are)|show me|take me to|link(?: me)?(?: to)?|open|i want to see|i'?d like to see)(?: the)? /;

function navigation(q: string): QuickReply | null {
  // "How can I contact him?": public channels only.
  if (/^(?:how (?:can|do|could|should) i (?:contact|reach|email|get in touch with|talk to|connect with) (?:him|sree|sreevarshan)|(?:his )?contact(?: info| information| details)?|how to (?:contact|reach) (?:him|sree))$/.test(q)) {
    return {
      kind: "navigation",
      text: `Email is the best way to reach Sree: ${profile.email}. He's also on [LinkedIn](${profile.links.linkedin}), and his code is on [GitHub](${profile.links.github}).`,
      sourceMap: [
        { id: "S1", label: "LinkedIn", href: profile.links.linkedin },
        { id: "S2", label: "GitHub", href: profile.links.github },
      ],
      suggestions: ["Who is Sree?", "What has he built?", "What did he build at RightRev?"],
    };
  }
  const m = NAV_LEAD.exec(q);
  if (!m) return null;
  const target = q.slice(m[0].length).replace(/ (?:please|page|section|link)$/, "").trim();
  const d = DESTINATIONS.find((x) => x.match.test(target));
  if (!d) return null;
  return { kind: "navigation", text: d.text.replace("{href}", d.href), sourceMap: [{ id: "S1", label: d.label, href: d.href }], suggestions: STARTERS.slice(0, 3) };
}

/**
 * The deterministic reply for a message, or null when the model should answer.
 * `turns` is the number of earlier visitor messages (a repeated "hi" mid-chat
 * gets a shorter reply).
 */
export function quickReply(message: string, turns = 0): QuickReply | null {
  // Attempts to extract the instructions or secrets get a fixed answer: the
  // model never sees them, so no phrasing can talk it into complying.
  if (EXTRACTION.test(message.toLowerCase())) {
    return {
      kind: "guard",
      text: "I can't share how I'm set up behind the scenes, but I'm happy to help with anything about Sree's work, projects or experience.",
      sourceMap: [],
      suggestions: STARTERS.slice(0, 3),
    };
  }
  const q = clean(message);
  if (!q || q.length > 80) return null;
  const nav = navigation(q);
  if (nav) return nav;
  const base = { sourceMap: [] as SourceRef[], suggestions: STARTERS };
  if (RX.greeting.test(q)) {
    if (/vana?kk?am/.test(q)) return { ...base, kind: "greeting", text: VANAKKAM };
    if (turns > 0) return { ...base, kind: "greeting", text: "Hey again! What else would you like to know?" };
    return { ...base, kind: "greeting", text: pick(GREETINGS, q) };
  }
  if (RX.wellbeing.test(q)) return { ...base, kind: "wellbeing", text: pick(WELLBEING_REPLIES, q) };
  if (RX.goodbye.test(q)) return { ...base, kind: "goodbye", text: pick(GOODBYE_REPLIES, q), suggestions: [] };
  if (RX.compliment.test(q)) return { ...base, kind: "compliment", text: pick(COMPLIMENT_REPLIES, q) };
  if (RX.thanks.test(q)) return { ...base, kind: "thanks", text: pick(THANKS_REPLIES, q), suggestions: turns ? [] : STARTERS };
  return null;
}

/**
 * Pasted job descriptions: long text with requirement language. They are
 * answered in Recruiter Mode with the named skills pinned as evidence.
 */
export function looksLikeJobDescription(text: string): boolean {
  if (text.length < 280) return false;
  const signals = [/\brequirements?\b/i, /\bresponsibilit/i, /\bqualifications?\b/i, /\byears? of experience\b/i, /\bwe are looking for\b|\bwe're looking for\b|\byou will\b|\byou'll\b/i, /\bnice to have\b|\bpreferred\b|\bbonus\b/i, /\bmust have\b|\brequired\b/i, /\babout the role\b|\bthe role\b/i];
  return signals.filter((r) => r.test(text)).length >= 2 || (text.match(/^\s*[-•*]\s+/gm)?.length ?? 0) >= 4;
}
