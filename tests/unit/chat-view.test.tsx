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

  it("greets the visitor and shows starter questions", () => {
    render(
      <AskSreeProvider>
        <ChatView variant="floating" />
      </AskSreeProvider>,
    );
    expect(screen.getByText("Hey! I'm Sree's AI assistant. Ask me about his experience, projects, achievements, or what he's building.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Who is Sree\?/ })).toBeInTheDocument();
  });

  it("shows suggested questions and streams an answer with sources and follow-ups", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      streamResponse([
        { type: "delta", text: "Sree built **Snowflake Cortex** agents. Email sreevarshan.dev@gmail.com (mailto:sreevarshan.dev@gmail.com)." },
        { type: "sources", sources: [{ title: "RightRev", href: "/experience#rightrev", section: "Experience" }] },
        { type: "suggestions", items: ["Explain his Snowflake Cortex AI agent work"] },
        { type: "done" },
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(
      <AskSreeProvider>
        <ChatView variant="page" />
      </AskSreeProvider>,
    );
    const suggestion = screen.getByRole("button", { name: /What has he built\?/ });
    await userEvent.click(suggestion);
    await waitFor(() => expect(screen.getByText("Snowflake Cortex")).toBeInTheDocument());
    expect(screen.getByRole("link", { name: "RightRev" })).toHaveAttribute("href", "/experience#rightrev");
    // The duplicated "(mailto:…)" collapses into one well-formed email link.
    const mail = screen.getAllByRole("link", { name: "sreevarshan.dev@gmail.com" });
    expect(mail).toHaveLength(1);
    expect(mail[0]).toHaveAttribute("href", "mailto:sreevarshan.dev@gmail.com");
    expect(screen.queryByText(/\(mailto:/)).toBeNull();
    expect(screen.getByRole("button", { name: "Explain his Snowflake Cortex AI agent work" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy response" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.messages.at(-1)).toEqual({ role: "user", content: "What has he built?" });
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
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/couldn't connect/));
  });

  it("explains a fallback in plain words, lists pages, and offers a retry that works", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        streamResponse([
          { type: "fallback", reason: "unavailable", links: [{ title: "About Sree", href: "/about", blurb: "Boston-based engineer." }] },
          { type: "suggestions", items: [] },
          { type: "done" },
        ]),
      )
      .mockResolvedValueOnce(streamResponse([{ type: "delta", text: "He is an engineer in Boston." }, { type: "done" }]));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <AskSreeProvider>
        <ChatView variant="page" />
      </AskSreeProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Who is Sree?" }));
    await waitFor(() => expect(screen.getByText(/can't write an answer right now/)).toBeInTheDocument());
    expect(screen.queryByText(/AI model offline/)).toBeNull();
    expect(screen.getByRole("link", { name: /About Sree/ })).toHaveAttribute("href", "/about");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(screen.getByText("He is an engineer in Boston.")).toBeInTheDocument());
    // The failed attempt is not replayed to the model.
    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body.messages).toEqual([{ role: "user", content: "Who is Sree?" }]);
  });

  it("renders source-id citations as numbered, verified links and no model-written links", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        streamResponse([
          { type: "sourceMap", items: [{ id: "S1", label: "About Sree", href: "/about" }, { id: "S2", label: "RightRev", href: "/experience#rightrev" }] },
          { type: "delta", text: "He is a Boston-based engineer [S1]. He built Snowflake Cortex AI agents at RightRev [S2][S7]. Reach him at sreevarshan.dev@gmail.com. More at [his site](https://evil.example)." },
          { type: "done" },
        ]),
      ),
    );
    const { container } = render(
      <AskSreeProvider>
        <ChatView variant="page" />
      </AskSreeProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Who is Sree?" }));
    await waitFor(() => expect(screen.getByRole("link", { name: "Source 1: About Sree" })).toHaveAttribute("href", "/about"));
    expect(screen.getByRole("link", { name: "Source 2: RightRev" })).toHaveAttribute("href", "/experience#rightrev");
    expect(container.querySelector(".md")!.textContent).not.toMatch(/\[S\d\]/);
    // Unknown id S7 adds nothing; the off-site link is shown as text only.
    expect(container.querySelectorAll(".md .cite")).toHaveLength(2);
    expect(screen.queryByRole("link", { name: "his site" })).toBeNull();
    expect(screen.getByText("his site")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "sreevarshan.dev@gmail.com" })).toHaveAttribute("href", "mailto:sreevarshan.dev@gmail.com");
    const sources = screen.getByRole("list", { name: "Sources" });
    expect(sources).toHaveTextContent("1About Sree");
    expect(sources).toHaveTextContent("2RightRev");
  });

  it("never renders raw HTML from an answer", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(streamResponse([{ type: "delta", text: 'Hi <img src=x onerror="alert(1)"> <script>alert(1)</script>there' }, { type: "done" }])));
    const { container } = render(
      <AskSreeProvider>
        <ChatView variant="page" />
      </AskSreeProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Who is Sree?" }));
    await waitFor(() => expect(container.querySelector(".md")).toBeTruthy());
    expect(container.querySelector(".md img, .md script")).toBeNull();
  });
});
