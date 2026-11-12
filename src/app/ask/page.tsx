import type { Metadata } from "next";
import { ChatView } from "@/components/ask/ChatView";

export const metadata: Metadata = {
  title: "Ask Sree",
  description: "An AI assistant that answers questions about Sree's experience, projects and skills using only verified portfolio content.",
  alternates: { canonical: "/ask" },
};

export default function AskPage() {
  return (
    <section className="container-x pb-10 pt-24 md:pt-28" aria-labelledby="ask-title">
      <h1 id="ask-title" className="sr-only">Ask Sree — AI assistant</h1>
      <div className="panel mx-auto flex h-[calc(100dvh-8rem)] min-h-[520px] max-w-3xl flex-col overflow-hidden">
        <ChatView variant="page" />
      </div>
    </section>
  );
}
