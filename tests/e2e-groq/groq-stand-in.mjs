/**
 * Local stand-in for Groq's OpenAI-compatible Chat Completions endpoint, used
 * only by the Groq end-to-end tests. Streams server-sent events exactly like
 * the real API (`data: {...}` chunks, then `data: [DONE]`). Not a real model:
 * the end-to-end tests verify the integration plumbing, not answer quality.
 *
 *   POST /openai/v1/chat/completions   streaming completion
 *   GET  /__last                       the last request body (for assertions)
 */
import http from "node:http";

const PORT = Number(process.env.GROQ_STAND_IN_PORT ?? 4610);
let last = null;

const ANSWERS = [
  [/overload/i, null],
  [/cut ?off/i, "Sreevarshan is an engineer based in Boston who builds "],
  [/there|stack/i, "At RightRev he worked with [S1]:\n\n• Snowflake Cortex\n• SQL stored procedures\n• MCP"],
  [/.*/, "**Sreevarshan Sathiyamurthy** (Sree) is an engineer based in Boston, Massachusetts [S1]. Most recently he built Snowflake Cortex AI agents and MCP integrations as a Software & Data Engineer Intern at RightRev [S1][S2].\n\nYou can reach him at sreevarshan.dev@gmail.com (mailto:sreevarshan.dev@gmail.com)."],
];

http
  .createServer((req, res) => {
    if (req.method === "GET" && req.url === "/__last") {
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(last));
    }
    if (req.method !== "POST" || !req.url.endsWith("/chat/completions")) {
      res.writeHead(404);
      return res.end();
    }
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      const body = JSON.parse(raw);
      last = { ...body, authorized: req.headers.authorization === "Bearer e2e-stand-in-key" };
      if (!last.authorized) {
        res.writeHead(401, { "content-type": "application/json" });
        return res.end(JSON.stringify({ error: { type: "invalid_request_error", code: "invalid_api_key" } }));
      }
      const question = String(body.messages.at(-1).content).split("Visitor question:").pop();
      const [, answer] = ANSWERS.find(([re]) => re.test(question));
      if (answer === null) {
        res.writeHead(429, { "content-type": "application/json", "retry-after": "2" });
        return res.end(JSON.stringify({ error: { type: "rate_limit_exceeded" } }));
      }
      res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache" });
      const send = (o) => res.write(`data: ${JSON.stringify(o)}\n\n`);
      send({ id: "chatcmpl-e2e", object: "chat.completion.chunk", model: body.model, choices: [{ index: 0, delta: { role: "assistant", content: "" }, finish_reason: null }] });
      const parts = answer.match(/[\s\S]{1,14}/g);
      let i = 0;
      const tick = setInterval(() => {
        if (i < parts.length) return send({ choices: [{ index: 0, delta: { content: parts[i++] }, finish_reason: null }] });
        clearInterval(tick);
        if (/cut ?off/i.test(question)) return res.destroy();
        send({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }], x_groq: { usage: { completion_tokens: parts.length } } });
        res.end("data: [DONE]\n\n");
      }, 70);
    });
  })
  .listen(PORT, "127.0.0.1", () => console.log(`groq stand-in on ${PORT}`));
