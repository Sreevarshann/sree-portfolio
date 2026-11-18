/**
 * Deterministic intent and entity recognition for Sree AI questions.
 * Retrieval uses it to put authoritative records first (the profile for
 * identity questions, experience records for work questions, and so on)
 * instead of relying on keyword overlap alone.
 */
export type Intent =
  | "identity"
  | "experience"
  | "project"
  | "achievement"
  | "certification"
  | "education"
  | "skills"
  | "contact"
  | "fit"
  | "assistant"
  | "hiring"
  | "casual"
  | "private"
  | "knowledge"
  | "general";

/**
 * How the answer should behave, derived from the intents (not a separate model
 * call): which kind of statement leads, and whether citations are expected.
 *   facts     verified professional facts, cited
 *   hiring    confident, evidence-based advocacy plus a next step
 *   casual    playful and honest; unknown personal facts stay unknown
 *   private   brief, friendly decline; nothing guessed or leaked
 *   knowledge general explanation, not presented as a fact about Sree
 *   recruiter evidence mapped to requirements: direct, related, not documented
 *             (chosen by the visitor's Recruiter Mode toggle, never inferred)
 */
export type Mode = "facts" | "hiring" | "casual" | "private" | "knowledge" | "recruiter";

export type EntityKind = "experience" | "project" | "achievement" | "education" | "resume";
export type Entity = { kind: EntityKind; id: string; label: string };

/**
 * Entity → knowledge-chunk id prefix, and the phrases that name it.
 * `tech` marks a match on a technology term rather than the entity's own name
 * ("What is MCP?" is a general question that RightRev evidence can follow;
 * "What did he do at RightRev?" is about RightRev).
 */
const ENTITIES: (Entity & { match: RegExp; tech?: RegExp })[] = [
  { kind: "experience", id: "exp-rightrev", label: "RightRev", match: /\bright\s?rev\b/, tech: /\bsnowflake\b|\bcortex\b|\bmcp\b|\bmodel context protocol\b/ },
  { kind: "experience", id: "exp-flare-innovation", label: "Flare Innovation", match: /\bflare\b/ },
  { kind: "experience", id: "exp-sri-sairam-techno-incubator", label: "Sri Sairam Techno Incubator", match: /\bincubator\b|\bsstif\b|\bsri sairam\b(?! (engineering|college))/ },
  { kind: "achievement", id: "ach-sauvc", label: "Singapore AUV Challenge", match: /\bsauvc\b|\bsingapore\b|\bauv\b|\bunderwater\b|\brobosub\b/ },
  { kind: "achievement", id: "ach-google-mlops-expo", label: "Google MLOps Expo", match: /\bcharlie\b|\bmlops\b|\bexpo\b|\bmbta\b/ },
  { kind: "project", id: "proj-aegis-ai", label: "AEGIS AI", match: /\baegis\b|\bfraud\b/ },
  { kind: "project", id: "proj-nexus-ai", label: "NEXUS AI", match: /\bnexus\b/ },
  { kind: "project", id: "proj-sourceatlas", label: "SourceAtlas", match: /\bsource\s?atlas\b/ },
  { kind: "project", id: "proj-tunelab", label: "TuneLab", match: /\btune\s?lab\b|\blora\b|\bfine[\s-]?tun/ },
  { kind: "project", id: "proj-insightforge", label: "InsightForge", match: /\binsight\s?forge\b/ },
  { kind: "project", id: "proj-reviewpilot", label: "ReviewPilot", match: /\breview\s?pilot\b/ },
  { kind: "project", id: "proj-workmesh", label: "WorkMesh", match: /\bwork\s?mesh\b/ },
  { kind: "resume", id: "resume-event-processing", label: "Event Processing Dashboard", match: /\bevent[\s-]processing\b|\bmonitoring dashboard\b|\b143k\b/ },
  { kind: "education", id: "edu-Northeastern University", label: "Northeastern University", match: /\bnortheastern\b|\bneu\b|\bm\.?s\.?\b|\bmaster'?s?\b|\bgrad(uate)? school\b/ },
  { kind: "education", id: "edu-Anna University", label: "Anna University", match: /\banna\b|\bsairam engineering\b|\bbachelor'?s?\b|\bundergrad|\bb\.?\s?e\.?\b|\bb\.?tech\b/ },
];

const INTENT_RULES: [Intent, RegExp][] = [
  // Private or sensitive personal matters: never guessed, never leaked.
  ["private", /\b(girl ?friend|boy ?friend|wife|husband|married|dating|single|relationship|crush|salary|pay(ing)?\b|compensation|how much (does|would|will) he (make|earn|charge|cost)|rate\b|age\b|how old|religio|address|phone|visa|sponsor|citizen|green card|h-?1b|\bopt\b|immigration|work authori[sz]ation)/],
  // Hiring and recruiter questions: availability, fit, recommendation, engagements.
  ["hiring", /\bhir(e|ing)\b|\brecruit|\bavailab|\bopen to (work|roles|opportunit)|\blooking for (a )?(job|role|work)|\bworth (talking|interviewing|hiring)|\brecommend (him|sree)\b|\b(can|could) (he|sree) (build|make|create|develop|help)\b.{0,40}\b(my|our|for (a|my|our))\b|\b(relocat|move to|start date|notice period|remote)\b|\bwork for (us|me|my)\b/],
  // Casual, personal or playful questions.
  ["casual", /\b(dance|danc(ing|er)|sing|cook|joke|funny|fun fact|hobb(y|ies)|free time|weekend|personality|smart|intelligent|genius|cool|favou?rite|sports?|game|music|movie|pet|coffee|tea|(not|isn't|isnt) on (his )?(resume|cv)|interesting about|like (outside|besides)|introvert|extrovert)\b/],
  ["assistant", /\b(ignore|disregard|forget)\b.{0,40}\b(instruction|prompt|rule|above)s?\b|\bsystem prompt\b|\byour (instructions|rules|prompt)\b|\bare you (an? )?(ai|bot|human|real|sree)\b|\bwho (made|built|created) you\b|\bwhat are you\b|\bjailbreak\b|\bpretend (to be|you are)\b/],
  ["contact", /\bcontact\b|\breach (him|out|sree)\b|\bget in touch\b|\bemail\b|\blinkedin\b|\bhow (do|can) i (talk|connect|speak)\b|\bresume\b|\bcv\b/],
  ["certification", /\bcertif|\bcredential|\baws\b|\bcourse(s|work)?\b|\bcisco\b/],
  ["education", /\bstud(y|ying|ies|ied)\b|\bdegree\b|\buniversit|\bcollege\b|\bschool\b|\bc?gpa\b|\beducation\b|\bgraduat|\bacademic|\bmajor\b/],
  ["fit", /\bwhy (should|would|hire|work)\b|\bhire\b|\b(good|great|right) (fit|candidate)\b|\bfit (for|the)\b|\bwork with (him|sree)\b|\bstand out\b|\bstrong candidate\b|\bsuitable\b|\bqualified\b|\bweakness(es)?\b|\b(experience |skill )?gaps?\b|\blimitations?\b|\bmatch (his|sree's|this|the)\b|\bjob description\b/],
  ["achievement", /\bachiev|\baward|\bwon\b|\bwin\b|\bcompetition|\bchallenge\b|\bprize|\b\d+(st|nd|rd|th) place\b|\bplace[d]?\b|\brank|\bhackathon|\bexpo\b|\baccomplish/],
  ["experience", /\bexperience\b|\bwork(ed|ing)?\b(?! with)|\bjob|\bintern|\bemploy|\bcompan(y|ies)\b|\bcareer\b|\bposition\b|\brole\b(?!s? (would|does) he)|\bwork history\b/],
  ["project", /\bprojects?\b|\bbuil[td]\b|\bbuilding\b|\bgithub\b|\brepo(sitor(y|ies))?\b|\bside project|\bshipped\b|\bmade\b/],
  ["skills", /\bdoes he know\b|\bfamiliar with\b|\bexperience (with|in)\b|\bskill|\bstrength|\bstrongest\b|\btech(nical)? stack\b|\btechnolog|\blanguages?\b|\btools?\b|\bgood at\b|\bexpert|\bproficien|\bframeworks?\b|\bpython\b|\bsql\b/],
  ["identity", /\bwho('s| is)\b|\babout (him|sree|sreevarshan)\b|\bintroduce\b|\bbackground\b|\bsummar|\btell me about (him|sree|sreevarshan|ss)\b|\bbio\b|\boverview\b|\bwhere is he based\b|\bwhat (does|do) (he|sree|sreevarshan) do\b|\bwhat (is|'s) his (job|focus|field|specialty|speciality)\b|\bwhat kind of (engineer|work)\b/],
];

/** Words that name Sree himself: they appear in nearly every chunk, so they carry no ranking signal. */
export const NAME_TOKENS = new Set(["sree", "sreevarshan", "sathiyamurthy", "ss", "sree's", "sreevarshan's"]);

/** Pronouns and short forms that signal a follow-up about the previous topic. */
const ANAPHORA = /\b(it|its|it's|that|this|there|those|these|they|them|their|same|more|else|further|elaborate|expand|one|ones|other|others|former|latter|simpler|simply)\b/;
/** Short questions about an aspect of whatever was just discussed ("What results did he achieve?"). */
const ASPECT = /\b(tools?|stack|technolog\w*|results?|outcomes?|metrics?|impact|numbers|achieve[ds]?|challeng\w*|hardest|toughest|easiest|why|how long|team|role|responsibilit\w*|architecture|design|tested|testing)\b/;

export type Analysis = { intents: Intent[]; entities: Entity[]; followUp: boolean; mentionsName: boolean };

/** General-knowledge question: "what is RAG?", "explain Kafka", with no reference to Sree. */
const KNOWLEDGE = /^(what('s| is| are)|explain|define|how (does|do|is)|why (does|do|is)|what's the difference|difference between)\b/;
const ABOUT_SREE = /\b(he|him|his|sree|sreevarshan|sathiyamurthy|ss)\b/;

export function analyze(question: string): Analysis {
  const q = question.toLowerCase().replace(/[’`]/g, "'");
  const hits = ENTITIES.map((e) => ({ e, named: e.match.test(q), tech: !!e.tech?.test(q) })).filter((h) => h.named || h.tech);
  const entities = hits.map(({ e: { kind, id, label } }) => ({ kind, id, label }));
  // Entities the question names outright (not through a technology term).
  const named = hits.some((h) => h.named);
  // A named entity decides the primary intent ("What did he build at RightRev?" is about experience).
  const implied = entities.map((e): Intent => (e.kind === "resume" ? "project" : e.kind));
  const intents = [...new Set([...implied, ...INTENT_RULES.filter(([, re]) => re.test(q)).map(([i]) => i)])];
  const mentionsName = /\b(sree|sreevarshan|sathiyamurthy|ss)\b/.test(q);
  const words = q.split(/\s+/).filter(Boolean).length;
  // A question that names Sree and asks something specific starts a new topic ("Who is Sree?").
  const ownTopic = mentionsName && intents.some((i) => i !== "general");
  const followUp = !entities.length && !ownTopic && (ANAPHORA.test(q) || words <= 4 || (words <= 8 && ASPECT.test(q)));
  // General knowledge ("What is MCP?") may still name a technology tied to his work; the evidence follows the explanation.
  if (!named && !ABOUT_SREE.test(q) && KNOWLEDGE.test(q.trim()) && !intents.some((i) => i === "private" || i === "hiring")) intents.unshift("knowledge");
  if (!intents.length) intents.push("general");
  return { intents, entities, followUp, mentionsName };
}

/** The answer mode for an analysis: private wins, then hiring, casual and general knowledge. */
export function modeOf(a: Pick<Analysis, "intents">): Mode {
  if (a.intents.includes("private")) return "private";
  if (a.intents.includes("hiring") || a.intents.includes("fit")) return "hiring";
  if (a.intents.includes("casual")) return "casual";
  if (a.intents[0] === "knowledge") return "knowledge";
  return "facts";
}

/** Suggested next questions, chosen from the topic of the latest answer. */
const NEXT: Record<string, string[]> = {
  "exp-rightrev": ["Explain his Snowflake Cortex AI agent work", "What tech stack did he use at RightRev?", "What did he do before RightRev?"],
  "exp-flare-innovation": ["What did he build at RightRev?", "What are his strongest data engineering skills?", "What is he studying at Northeastern?"],
  "exp-sri-sairam-techno-incubator": ["What did he achieve at the Singapore AUV Challenge?", "What did he build at RightRev?", "What is Charlie?"],
  "ach-sauvc": ["What did he build for the AUV?", "What is Charlie?", "What did he do at the Techno Incubator?"],
  "ach-google-mlops-expo": ["What did he achieve at the Singapore AUV Challenge?", "What are his strongest technical skills?", "What has he built recently?"],
  "proj-aegis-ai": ["How is AEGIS AI tested?", "What is SourceAtlas?", "What did he build at RightRev?"],
  "proj-nexus-ai": ["How does NEXUS AI keep agents in check?", "What is SourceAtlas?", "What is his most impressive project?"],
  "proj-sourceatlas": ["How does SourceAtlas cite its sources?", "What is TuneLab?", "Explain his Snowflake Cortex AI agent work"],
  "proj-tunelab": ["What results did TuneLab report?", "What is SourceAtlas?", "What are his strongest technical skills?"],
  "proj-insightforge": ["What is AEGIS AI?", "What are his strongest data engineering skills?", "What is his most impressive project?"],
  "proj-reviewpilot": ["What is WorkMesh?", "What is his most impressive project?", "What did he build at RightRev?"],
  "proj-workmesh": ["What is ReviewPilot?", "What is his most impressive project?", "What are his strongest technical skills?"],
  identity: ["What did he build at RightRev?", "What is his most impressive project?", "What is he studying at Northeastern?"],
  experience: ["Explain his Snowflake Cortex AI agent work", "What are his strongest technical skills?", "What is his most impressive project?"],
  project: ["What is his most impressive project?", "How does he test his projects?", "What did he build at RightRev?"],
  achievement: ["What did he achieve at the Singapore AUV Challenge?", "What is Charlie?", "What has he built recently?"],
  certification: ["What is he studying at Northeastern?", "What are his strongest technical skills?", "How can I contact him?"],
  education: ["What certifications does he have?", "What did he build at RightRev?", "What are his strongest technical skills?"],
  skills: ["What is his most impressive project?", "What did he build at RightRev?", "Why would he be a good fit for an AI engineering role?"],
  contact: ["Who is Sree?", "What did he build at RightRev?", "What is his most impressive project?"],
  fit: ["What are his strongest technical skills?", "What did he build at RightRev?", "How can I contact him?"],
  assistant: ["Who is Sree?", "What has he built?", "What did he build at RightRev?"],
  hiring: ["What did he build at RightRev?", "What is his most impressive project?", "How can I contact him?"],
  casual: ["What is his greatest achievement?", "What has he built recently?", "Why should we hire him?"],
  private: ["Can I hire Sree?", "What are his strongest technical skills?", "How can I contact him?"],
  knowledge: ["How has Sree used RAG?", "What did he build at RightRev?", "What is his most impressive project?"],
  general: ["Who is Sree?", "What has he built?", "What did he build at RightRev?"],
};

export function suggestFollowUps(a: Pick<Analysis, "intents" | "entities">, asked: string, n = 3): string[] {
  const key = a.entities[0]?.id ?? a.intents[0] ?? "general";
  const pool = [...(NEXT[key] ?? []), ...(NEXT[a.intents[0]] ?? []), ...NEXT.general];
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  const seen = new Set([norm(asked)]);
  const out: string[] = [];
  for (const s of pool) {
    if (seen.has(norm(s))) continue;
    seen.add(norm(s));
    out.push(s);
    if (out.length === n) break;
  }
  return out;
}
