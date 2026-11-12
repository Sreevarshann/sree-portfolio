import { describe, expect, it } from "vitest";
import { retrieve, retrieveForConversation, tokenize } from "@/lib/ai/retrieve";
import { knowledge } from "@/lib/ai/knowledge";

const PHONE = /\+?\d?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;

describe("retrieval", () => {
  it("tokenizes and drops stop words", () => {
    expect(tokenize("What did Sree work on at RightRev?")).toEqual(["sree", "work", "rightrev"]);
  });

  it.each([
    ["What did Sree work on at RightRev?", "exp-rightrev"],
    ["Tell me about the Singapore AUV Challenge", "ach-sauvc"],
    ["What did Charlie win at the Google MLOps Expo?", "ach-google-mlops-expo"],
    ["What are Sree's certifications?", "certifications"],
    ["How can I contact Sree?", "contact"],
    ["How does the fraud detection pipeline handle duplicate events?", "proj-aegis-ai"],
    ["Explain LoRA fine-tuning results", "proj-tunelab"],
  ])("ranks the right chunk for %s", (q, prefix) => {
    const ids = retrieve(q, 6).map((c) => c.id);
    expect(ids.some((id) => id.startsWith(prefix))).toBe(true);
  });

  it("uses the previous turn for vague follow-ups", () => {
    const res = retrieveForConversation(["Tell me about AEGIS AI", "what tests does it have?"]);
    expect(res.some((c) => c.id.startsWith("proj-aegis-ai"))).toBe(true);
  });

  it("always includes the profile chunk", () => {
    expect(retrieveForConversation(["zzzz qqqq"]).some((c) => c.id === "profile")).toBe(true);
  });
});

describe("knowledge base privacy and honesty", () => {
  const all = knowledge.map((c) => c.text).join("\n");
  it("contains nothing shaped like a phone number", () => {
    expect(all).not.toMatch(PHONE);
  });
  it("labels the AWS course as training, not the certification exam", () => {
    expect(all).toMatch(/not the AWS Certified Cloud Practitioner/);
  });
  it("marks planned work explicitly", () => {
    expect(all).toMatch(/PLANNED extension and has not been built/);
  });
  it("makes no work-authorization claims", () => {
    expect(all).not.toMatch(/\bOPT\b|sponsorship|visa/i);
  });
});
