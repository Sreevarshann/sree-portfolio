import { describe, expect, it } from "vitest";
import { normalizeMarkdown } from "@/lib/ai/markdown";

const E = "sreevarshan.dev@gmail.com";

describe("normalizeMarkdown", () => {
  it.each([
    [`Email ${E} (mailto:${E}).`, `Email [${E}](mailto:${E}).`],
    [`Email mailto:${E} today`, `Email [${E}](mailto:${E}) today`],
    [`[${E}](mailto:${E}) (mailto:${E})`, `[${E}](mailto:${E})`],
    ["[GitHub](https://github.com/Sreevarshann) (https://github.com/Sreevarshann)", "[GitHub](https://github.com/Sreevarshann)"],
    ["[repo](https://github.com/x/y) — https://github.com/x/y", "[repo](https://github.com/x/y)"],
    ["• one\n• two", "- one\n- two"],
    ["1) one\n2) two", "1. one\n2. two"],
    ["a\n\n\n\nb", "a\n\nb"],
    ["Hi <b>there</b><script>x</script>", "Hi therex"],
  ])("%s", (input, expected) => {
    expect(normalizeMarkdown(input)).toBe(expected);
  });

  it("leaves valid links, comparisons and code alone", () => {
    const ok = `See [AEGIS AI](/projects/aegis-ai) and [email](mailto:${E}). p < 0.05 and \`a <b> c\`.`;
    expect(normalizeMarkdown(ok)).toBe(ok);
    const fence = "```\n<div>(mailto:x@y.com)</div>\n```";
    expect(normalizeMarkdown(fence)).toBe(fence);
  });
});
