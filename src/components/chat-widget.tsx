"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

type ChatLink = { href: string; label: string };
type ChatMessage = { role: "user" | "assistant"; text: string; links?: ChatLink[] };

const starter: ChatMessage = {
  role: "assistant",
  text: "Hello. Ask me about BazaarDost products, orders, shipping, or other services on this website.",
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([starter]);

  async function send(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (text.length < 2 || pending) return;
    setInput("");
    setMessages((current) => [...current, { role: "user", text }]);
    setPending(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = (await response.json()) as { reply?: string; links?: ChatLink[]; error?: string };
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: data.reply || data.error || "Please try that question again.",
          links: data.links || [],
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        { role: "assistant", text: "I couldn't reach the BazaarDost assistant. Please use the contact page." },
      ]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed bottom-20 right-3 z-50 md:bottom-6 md:right-6">
      {open ? (
        <section className="mb-3 flex h-[min(32rem,70vh)] w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-3xl border border-cream-300 bg-cream-50 shadow-card" aria-label="BazaarDost chat">
          <header className="flex items-center justify-between bg-forest-800 px-4 py-3 text-cream-50">
            <div>
              <p className="font-display text-lg leading-none">BazaarDost</p>
              <p className="text-xs text-cream-200">Products, orders, and services</p>
            </div>
            <button type="button" className="min-h-11 rounded-full px-3 text-sm font-semibold" onClick={() => setOpen(false)}>
              Close
            </button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={message.role === "user" ? "ml-8 text-right" : "mr-6"}>
                <p className={`inline-block rounded-2xl px-3 py-2 text-left text-sm leading-6 ${message.role === "user" ? "bg-forest-800 text-cream-50" : "bg-white text-forest-950"}`}>
                  {message.text}
                </p>
                {message.links && message.links.length > 0 ? (
                  <ul className="mt-1 space-y-1 text-left text-sm">
                    {message.links.map((link) => (
                      <li key={link.href + link.label}>
                        <Link href={link.href} className="font-semibold text-forest-800 underline" onClick={() => setOpen(false)}>
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
            {pending ? <p className="text-sm text-muted">Looking that up on BazaarDost…</p> : null}
          </div>
          <form onSubmit={send} className="flex gap-2 border-t border-cream-300 p-3">
            <label className="sr-only" htmlFor="bazaardost-chat">Ask about BazaarDost</label>
            <input
              id="bazaardost-chat"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={500}
              placeholder="Ask about a product or order"
              className="min-h-11 min-w-0 flex-1 rounded-full border border-cream-300 bg-white px-4 text-sm"
            />
            <button type="submit" disabled={pending} className="min-h-11 rounded-full bg-forest-800 px-4 text-sm font-semibold text-cream-50 disabled:opacity-60">
              Send
            </button>
          </form>
        </section>
      ) : null}
      <button
        type="button"
        className="min-h-11 rounded-full bg-forest-800 px-5 text-sm font-semibold text-cream-50 shadow-card"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Hide chat" : "Chat"}
      </button>
    </div>
  );
}
