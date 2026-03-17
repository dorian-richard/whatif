"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bot, Send, X, Maximize2, Minus } from "@/components/ui/icons";
import { useProfileStore } from "@/stores/useProfileStore";
import { getEffectiveStatus } from "@/lib/subscription";
import { buildFactoContext } from "@/lib/facto-context";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  "Mon bulletin de paie du mois",
  "Micro vs EURL vs SASU ?",
  "Diagnostic financier",
];

export function FactoWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const subscriptionStatus = useProfileStore((s) => s.subscriptionStatus);
  const trialEndsAt = useProfileStore((s) => s.trialEndsAt);
  const isPro = getEffectiveStatus(subscriptionStatus, trialEndsAt) === "ACTIVE";

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Focus input when opening
  useEffect(() => {
    if (open && isPro) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open, isPro]);

  // Hide on assistant page (full page already)
  if (pathname === "/assistant") return null;

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || streaming) return;

    const userMessage: Message = { role: "user", content: msg };
    const newMessages = [...messages, userMessage];
    setMessages([...newMessages, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    let assistantContent = "";

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, context: buildFactoContext() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erreur" }));
        assistantContent = `Erreur : ${err.error}`;
        setMessages((prev) => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content: assistantContent }; return u; });
        setStreaming(false);
        return;
      }

      const contentType = res.headers.get("content-type") ?? "";

      if (contentType.includes("text/event-stream")) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split("\n\n");
            buffer = parts.pop() ?? "";
            for (const part of parts) {
              const line = part.replace(/^data: /, "").trim();
              if (!line || line === "[DONE]") continue;
              try {
                const parsed = JSON.parse(line);
                if (parsed.t) {
                  assistantContent += parsed.t;
                  setMessages((prev) => {
                    const u = [...prev];
                    u[u.length - 1] = { role: "assistant", content: assistantContent };
                    return u;
                  });
                }
              } catch { /* skip */ }
            }
          }
        }
      } else {
        const data = await res.json();
        assistantContent = data.text ?? "OK";
        setMessages((prev) => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content: assistantContent }; return u; });
      }
    } catch {
      assistantContent = "Erreur de connexion. Reessaie.";
      setMessages((prev) => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content: assistantContent }; return u; });
    }

    setStreaming(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const proseClasses = "prose prose-sm dark:prose-invert max-w-none [&_p]:text-xs [&_p]:leading-relaxed [&_p]:my-1.5 [&_ul]:my-1 [&_ol]:my-1 [&_li]:text-xs [&_li]:my-0.5 [&_table]:text-[10px] [&_table]:my-2 [&_th]:px-2 [&_th]:py-1 [&_td]:px-2 [&_td]:py-1 [&_strong]:text-foreground [&_code]:text-[10px]";

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-5 right-5 z-50 size-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300",
          "bg-gradient-to-br from-[#5682F2] to-[#7C5BF2] text-white hover:scale-105 hover:shadow-xl",
          open && "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <Bot className="size-5" />
      </button>

      {/* Chat panel */}
      <div
        className={cn(
          "fixed bottom-5 right-5 z-50 w-[380px] max-w-[calc(100vw-40px)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right",
          open ? "scale-100 opacity-100" : "scale-75 opacity-0 pointer-events-none"
        )}
        style={{ height: "min(520px, calc(100vh - 120px))" }}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-border bg-gradient-to-r from-[#5682F2]/10 to-[#7C5BF2]/10 shrink-0">
          <div className="size-7 rounded-lg bg-gradient-to-br from-[#5682F2] to-[#7C5BF2] flex items-center justify-center">
            <Bot className="size-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-none">Facto</p>
            <p className="text-[10px] text-muted-foreground">Copilote financier</p>
          </div>
          <Link
            href="/assistant"
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Ouvrir en plein ecran"
          >
            <Maximize2 className="size-3.5" />
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Reduire"
          >
            <Minus className="size-4" />
          </button>
        </div>

        {/* Pro gate or chat */}
        {!isPro ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="size-12 rounded-2xl bg-gradient-to-br from-[#5682F2]/15 to-[#7C5BF2]/15 flex items-center justify-center mb-3">
              <Bot className="size-6 text-[#5682F2]" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">Facto est reserve au plan Pro</p>
            <p className="text-xs text-muted-foreground mb-4">
              Ton copilote financier IA, disponible 24h/24.
            </p>
            <Link
              href="/checkout?plan=monthly"
              className="px-5 py-2 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Passer Pro
            </Link>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <div className="size-10 rounded-xl bg-gradient-to-br from-[#5682F2] to-[#7C5BF2] flex items-center justify-center">
                    <Bot className="size-5 text-white" />
                  </div>
                  <p className="text-xs text-muted-foreground text-center max-w-[240px]">
                    Pose-moi une question sur tes finances, statut ou facturation.
                  </p>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {QUICK_PROMPTS.map((p) => (
                      <button
                        key={p}
                        onClick={() => handleSend(p)}
                        className="px-2.5 py-1.5 rounded-lg bg-muted/40 border border-border text-[11px] text-foreground hover:bg-muted/60 transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={cn("flex gap-2", msg.role === "user" && "justify-end")}>
                  {msg.role === "assistant" && (
                    <div className="size-5 rounded-md bg-gradient-to-br from-[#5682F2] to-[#7C5BF2] flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="size-2.5 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] rounded-xl px-3 py-2",
                      msg.role === "user"
                        ? "bg-primary text-white text-xs rounded-br-sm"
                        : "bg-muted/30 text-foreground rounded-bl-sm"
                    )}
                  >
                    {msg.content ? (
                      msg.role === "user" ? (
                        <span className="text-xs">{msg.content}</span>
                      ) : (
                        <div className={proseClasses}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                        </div>
                      )
                    ) : (streaming && i === messages.length - 1 && (
                      <span className="inline-flex gap-1 py-0.5">
                        <span className="size-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                        <span className="size-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                        <span className="size-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="border-t border-border px-3 py-2 shrink-0">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Demande a Facto..."
                  rows={1}
                  className="flex-1 resize-none px-3 py-2 bg-muted/40 border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[#5682F2]/40 max-h-20"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || streaming}
                  className={cn(
                    "size-8 rounded-lg flex items-center justify-center transition-all shrink-0",
                    input.trim() && !streaming
                      ? "bg-gradient-to-br from-[#5682F2] to-[#7C5BF2] text-white hover:opacity-90"
                      : "bg-muted/50 text-muted-foreground/40"
                  )}
                >
                  <Send className="size-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
