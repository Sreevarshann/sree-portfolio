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
  | "general";

export type EntityKind = "experience" | "project" | "achievement" | "education" | "resume";
export type Entity = { kind: EntityKind; id: string; label: string };

/** Entity → knowledge-chunk id prefix, and the phrases that name it. */
const ENTITIES: (Entity & { match: RegExp })[] = [
  { kind: "experience", id: "exp-rightrev", label: "RightRev", match: /\bright\s?rev\b|\bsnowflake\b|\bcortex\b|\bmcp\b/ },
  { kind: "experience", id: "exp-flare-innovation", label: "Flare Innovation", match: /\bflare\b/ },
  { kind: "experience", id: "exp-sri-sairam-techno-incubator", label: "Sri Sairam Techno Incubator", match: /\bincubator\b|\bsstif\b/ },
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
  ["assistant", /\b(ignore|disregard|forget)\b.{0,40}\b(instruction|prompt|rule|above)s?\b|\bsystem prompt\b|\byour (instructions|rules|prompt)\b|\bare you (an? )?(ai|bot|human|real|sree)\b|\bwho (made|built|created) you\b|\bwhat are you\b|\bjailbreak\b|\bpretend (to be|you are)\b/],
  ["contact", /\bcontact\b|\breach (him|out|sree)\b|\bget in touch\b|\bemail\b|\blinkedin\b|\bhow (do|can) i (talk|connect|speak)\b|\bresume\b|\bcv\b/],
  ["certification", /\bcertif|\bcredential|\baws\b|\bcourse(s|work)?\b|\bcisco\b/],
  ["education", /\bstud(y|ying|ies|ied)\b|\bdegree\b|\buniversit|\bcollege\b|\bschool\b|\bc?gpa\b|\beducation\b|\bgraduat|\bacademic|\bmajor\b/],
  ["fit", /\bwhy (should|would|hire|work)\b|\bhire\b|\b(good|great|right) (fit|candidate)\b|\bfit (for|the)\b|\bwork with (him|sree)\b|\bstand out\b|\bstrong candidate\b/],
  ["achievement", /\bachiev|\baward|\bwon\b|\bwin\b|\bcompetition|\bchallenge\b|\bprize|\b\d+(st|nd|rd|th) place\b|\bplace[d]?\b|\brank|\bhackathon|\bexpo\b|\baccomplish/],
  ["experience", /\bexperience\b|\bwork(ed|ing)?\b(?! with)|\bjob|\bintern|\bemploy|\bcompan(y|ies)\b|\bcareer\b|\bposition\b|\brole\b(?!s? (would|does) he)|\bwork history\b/],
  ["project", /\bprojects?\b|\bbuil[td]\b|\bbuilding\b|\bgithub\b|\brepo(sitor(y|ies))?\b|\bside project|\bshipped\b|\bmade\b/],
  ["skills", /\bskill|\bstrength|\bstrongest\b|\btech(nical)? stack\b|\btechnolog|\blanguages?\b|\btools?\b|\bgood at\b|\bexpert|\bproficien|\bframeworks?\b|\bpython\b|\bsql\b/],
  ["identity", /\bwho('s| is)\b|\babout (him|sree|sreevarshan)\b|\bintroduce\b|\bbackground\b|\bsummar|\btell me about (him|sree|sreevarshan|ss)\b|\bbio\b|\boverview\b|\bwhere is he based\b/],
];

/** Words that name Sree himself: they appear in nearly every chunk, so they carry no ranking signal. */
export const NAME_TOKENS = new Set(["sree", "sreevarshan", "sathiyamurthy", "ss", "sree's", "sreevarshan's"]);

/** Pronouns and short forms that signal a follow-up about the previous topic. */
const ANAPHORA = /\b(it|its|it's|that|this|there|those|these|they|them|their|same|more|else|further|elaborate|expand)\b/;

export type Analysis = { intents: Intent[]; entities: Entity[]; followUp: boolean; mentionsName: boolean };

export function analyze(question: string): Analysis {
  const q = question.toLowerCase().replace(/[’`]/g, "'");
  const entities = ENTITIES.filter((e) => e.match.test(q)).map(({ kind, id, label }) => ({ kind, id, label }));
  // A named entity decides the primary intent ("What did he build at RightRev?" is about experience).
  const implied = entities.map((e): Intent => (e.kind === "resume" ? "project" : e.kind));
  const intents = [...new Set([...implied, ...INTENT_RULES.filter(([, re]) => re.test(q)).map(([i]) => i)])];
  const mentionsName = /\b(sree|sreevarshan|sathiyamurthy|ss)\b/.test(q);
  const words = q.split(/\s+/).filter(Boolean).length;
  const followUp = !entities.length && (ANAPHORA.test(q) || words <= 4);
  if (!intents.length) intents.push("general");
  return { intents, entities, followUp, mentionsName };
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
