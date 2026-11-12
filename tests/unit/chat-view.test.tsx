import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AskSreeProvider } from "@/components/ask/AskSreeProvider";
import { ChatView } from "@/components/ask/ChatView";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

function streamResponse(lines: object[]) {
  const enc = new TextEncoder();
  const body = new ReadableStream({
    start(c) {
      for (const l of lines) c.enqueue(enc.encode(JSON.stringify(l) + "\n"));
      c.close();
    },
  });
  return new Response(body, { headers: { "content-type": "application/x-ndjson" } });
}

describe("ChatView", () => {
  beforeEach(() => sessionStorage.clear());

  it("shows suggested questions and streams an answer with sources", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      streamResponse([
        { type: "sources", sources: [{ title: "RightRev", href: "/experience#rightrev", section: "Experience" }] },
        { type: "delta", text: "Sree built **Snowflake Cortex** agents." },
        { type: "done" },
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(
      <AskSreeProvider>
        <ChatView variant="page" />
      </AskSreeProvider>,
    );
    const suggestion = screen.getByRole("button", { name: /What did Sree work on at RightRev/ });
    await userEvent.click(suggestion);
    await waitFor(() => expect(screen.getByText("Snowflake Cortex")).toBeInTheDocument());
    expect(screen.getByRole("link", { name: "RightRev" })).toHaveAttribute("href", "/experience#rightrev");
    expect(screen.getByRole("button", { name: "Copy response" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.messages.at(-1)).toEqual({ role: "user", content: "What did Sree work on at RightRev?" });
  });

  it("sends with Enter, keeps Shift+Enter for new lines, and enforces the length limit", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(streamResponse([{ type: "delta", text: "ok" }, { type: "done" }])));
    render(
      <AskSreeProvider>
        <ChatView variant="page" />
      </AskSreeProvider>,
    );
    const box = screen.getByLabelText("Ask a question about Sree");
    expect(box).toHaveAttribute("maxLength", "1000");
    await userEvent.type(box, "line one{Shift>}{Enter}{/Shift}line two");
    expect(box).toHaveValue("line one\nline two");
    await userEvent.type(box, "{Enter}");
    await waitFor(() => expect(screen.getByText("ok")).toBeInTheDocument());
  });

  it("shows an error state when the network fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <AskSreeProvider>
        <ChatView variant="page" />
      </AskSreeProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Who is Sree?" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/Couldn't reach Ask Sree/));
  });
});
