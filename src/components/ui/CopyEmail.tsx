"use client";

import { useState } from "react";

export function CopyEmail({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "done" | "fail">("idle");
  return (
    <button
      type="button"
      className="btn btn-ghost"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(email);
          setState("done");
        } catch {
          setState("fail");
        }
        window.setTimeout(() => setState("idle"), 1800);
      }}
    >
      <span aria-live="polite">{state === "done" ? "Copied ✓" : state === "fail" ? "Copy failed — select the address" : "Copy address"}</span>
    </button>
  );
}
