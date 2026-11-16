import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The theme-switch animation is finished design: the light theme's look may
 * change, but how the switch animates must not. These pins fail on any edit
 * to the toggle logic or its CSS; change them only on purpose.
 */
const root = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8").replace(/\r\n/g, "\n");

describe("theme-switch animation is unchanged", () => {
  it("ThemeToggle logic is byte-for-byte the shipped version", () => {
    const hash = createHash("sha256").update(read("src/components/layout/ThemeToggle.tsx")).digest("hex");
    expect(hash).toBe("f43a34586189ce0a9b590ad716e484d1df74808adc3becd9fb19163e2c558c12");
  });

  it("the circular reveal keeps its timing, easing and shape", () => {
    const css = read("src/app/globals.css");
    expect(css).toContain("animation: theme-reveal 760ms cubic-bezier(0.65, 0, 0.35, 1) both;");
    expect(css).toContain("clip-path: circle(0 at var(--vt-x, 50%) var(--vt-y, 0));");
    expect(css).toContain("clip-path: circle(var(--vt-r, 150vmax) at var(--vt-x, 50%) var(--vt-y, 0));");
    expect(css).toMatch(/html\.theme-vt::view-transition-old\(root\),\s*html\.theme-vt::view-transition-new\(root\) \{\s*animation: none;\s*mix-blend-mode: normal;/);
  });

  it("the cross-fade fallback keeps its 420ms color transition", () => {
    const css = read("src/app/globals.css");
    expect(css).toMatch(/html\.theme-transition \*::after \{\s*transition:\s*background-color 420ms var\(--ease-out\)/);
  });

  it("the light theme never restyles the transition", () => {
    const light = read("src/app/theme-light.css");
    expect(light).not.toMatch(/view-transition|theme-vt|theme-transition|theme-reveal/);
  });
});
