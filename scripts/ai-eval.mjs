// Repeatable Ask My AI evaluation against a deployed site (real model calls).
// usage: node scripts/ai-eval.mjs <baseUrl> <label> [trials=2]
// Writes docs/ai-eval/<label>.json. Paced under the per-minute rate limit.
import { writeFileSync } from "node:fs";

const [BASE, LABEL, TRIALS = "2"] = process.argv.slice(2);
const QUESTIONS = [
  "Who is Sree?", "Can I hire Sree?", "Why should we hire him?", "Is Sree smart?", "Can he dance?",
  "Does he have a girlfriend?", "What does he do at RightRev?", "What are his strongest technical skills?",
  "Can he build an AI agent for my business?", "What's his greatest achievement?", "Does he know LangGraph?",
  "What projects prove his data engineering skills?", "Can he explain his AEGIS architecture?",
  "What is retrieval-augmented generation?", "Tell me something funny about Sree.", "What are his weaknesses?",
  "How can I contact him?", "Can he move to another city?", "What salary does he expect?",
  "Tell me something about him that isn't on his resume.",
];
const CONVERSATIONS = [
  ["Can I hire Sree?", "What did he do at RightRev?", "Can you explain the AI agents?"],
  ["Does he know LangGraph?", "Which project used it?", "How does that project keep the agents in check?"],
  ["Can he dance?", "Okay, so what is he actually good at?"],
];
const GAP_MS = 8_500; // ~7 requests per minute
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ask(messages) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await askOnce(messages);
    } catch (e) {
      if (attempt >= 4) return { status: 0, answer: "", sources: [], fallback: null, error: `network: ${e.message}`, firstTokenMs: null, totalMs: 0, words: 0 };
      await sleep(5000 * attempt);
    }
  }
}

async function askOnce(messages) {
  const t0 = performance.now();
  let first = null;
  const res = await fetch(`${BASE}/api/chat`, { method: "POST", headers: { "content-type": "application/json", origin: BASE }, body: JSON.stringify({ messages }) });
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  const events = [];
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line) continue;
      const e = JSON.parse(line);
      if (e.type === "delta" && first === null) first = performance.now() - t0;
      events.push(e);
    }
  }
  const answer = events.filter((e) => e.type === "delta").map((e) => e.text).join("");
  return {
    status: res.status,
    answer,
    sources: (events.find((e) => e.type === "sources")?.sources ?? []).map((s) => s.title),
    fallback: events.find((e) => e.type === "fallback")?.reason ?? null,
    error: events.find((e) => e.type === "error")?.code ?? null,
    firstTokenMs: first === null ? null : Math.round(first),
    totalMs: Math.round(performance.now() - t0),
    words: answer.split(/\s+/).filter(Boolean).length,
  };
}

const save = () => writeFileSync(`docs/ai-eval/${LABEL}.json`, JSON.stringify(out, null, 2));
const out = { base: BASE, label: LABEL, at: new Date().toISOString(), single: [], conversations: [] };
for (let t = 1; t <= Number(TRIALS); t++) {
  for (const q of QUESTIONS) {
    const r = await ask([{ role: "user", content: q }]);
    out.single.push({ trial: t, q, ...r });
    save();
    console.log(`[${t}] ${q} -> ${r.status} ${r.words}w ${r.totalMs}ms${r.fallback ? " FALLBACK " + r.fallback : ""}${r.error ? " ERROR " + r.error : ""}`);
    await sleep(GAP_MS);
  }
}
for (const turns of CONVERSATIONS) {
  const history = [];
  const convo = [];
  for (const q of turns) {
    history.push({ role: "user", content: q });
    const r = await ask(history);
    history.push({ role: "assistant", content: r.answer || "(no answer)" });
    convo.push({ q, ...r });
    save();
    console.log(`[convo] ${q} -> ${r.words}w ${r.totalMs}ms`);
    await sleep(GAP_MS);
  }
  out.conversations.push(convo);
  save();
}
writeFileSync(`docs/ai-eval/${LABEL}.json`, JSON.stringify(out, null, 2));
console.log("wrote", `docs/ai-eval/${LABEL}.json`);
