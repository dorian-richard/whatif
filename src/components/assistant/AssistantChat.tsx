"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useProfileStore } from "@/stores/useProfileStore";
import { useInvoiceStore } from "@/stores/useInvoiceStore";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Sparkles, Send, X, Bot } from "@/components/ui/icons";

const ALLOWED_EMAILS = ["dorich@icloud.com"];

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Quel est mon TJM optimal ?",
  "Dois-je passer en EURL ou SASU ?",
  "Comment optimiser ma fiscalité ?",
  "Analyse ma situation financière",
];

export function AssistantChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const profile = useProfileStore();
  const { documents } = useInvoiceStore();

  // Check if user is allowed
  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email && ALLOWED_EMAILS.includes(user.email)) {
        setAllowed(true);
      }
    }
    check();
  }, []);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  function buildContext() {
    const activeClients = profile.clients.filter(c => c.isActive !== false);
    const totalCA = activeClients.reduce((sum, c) => {
      if (c.billing === "tjm") return sum + (c.dailyRate ?? 0) * (c.daysPerMonth ?? (c.daysPerWeek ?? 0) * 4.33) * 12;
      if (c.billing === "forfait") return sum + (c.monthlyAmount ?? 0) * 12;
      if (c.billing === "mission") return sum + (c.totalAmount ?? 0);
      return sum;
    }, 0);

    const invoiceStats = {
      total: documents.length,
      unpaid: documents.filter(d => d.type === "facture" && (d.status === "sent" || d.status === "late")).length,
      unpaidAmount: documents.filter(d => d.type === "facture" && (d.status === "sent" || d.status === "late")).reduce((s, d) => s + d.totalTTC, 0),
      drafts: documents.filter(d => d.status === "draft").length,
    };

    return {
      businessStatus: profile.businessStatus,
      role: profile.role,
      companyName: profile.companyName,
      monthlyExpenses: profile.monthlyExpenses,
      savings: profile.savings,
      workDaysPerWeek: profile.workDaysPerWeek,
      age: profile.age,
      monthlySalary: profile.monthlySalary,
      nbParts: profile.nbParts,
      chargesPro: profile.chargesPro,
      clients: activeClients.map(c => ({
        name: c.name,
        companyName: c.companyName,
        billing: c.billing,
        dailyRate: c.dailyRate,
        daysPerWeek: c.daysPerWeek,
        daysPerMonth: c.daysPerMonth,
        monthlyAmount: c.monthlyAmount,
        totalAmount: c.totalAmount,
        isActive: c.isActive,
      })),
      caAnnuel: Math.round(totalCA),
      invoices: invoiceStats,
    };
  }

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || streaming) return;

    const userMessage: Message = { role: "user", content: msg };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    // Add empty assistant message (loading state)
    setMessages([...newMessages, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          context: buildContext(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: `Erreur : ${data.error ?? "Impossible de contacter l'assistant."}` };
          return updated;
        });
      } else {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: data.text ?? "Pas de réponse." };
          return updated;
        });
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "Erreur de connexion. Réessaie." };
        return updated;
      });
    }

    setStreaming(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!allowed) return null;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 right-6 z-50 size-12 rounded-full flex items-center justify-center shadow-lg transition-all",
          "bg-gradient-to-br from-[#5682F2] to-[#7C5BF2] text-white hover:scale-105 active:scale-95",
          open && "rotate-0"
        )}
      >
        {open ? <X className="size-5" /> : <Sparkles className="size-5" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-[380px] h-[80vh] max-h-[700px] flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-gradient-to-r from-[#5682F2]/10 to-[#7C5BF2]/10">
            <div className="size-8 rounded-lg bg-gradient-to-br from-[#5682F2] to-[#7C5BF2] flex items-center justify-center">
              <Bot className="size-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Assistant Freelens</p>
              <p className="text-[10px] text-muted-foreground">Copilote financier IA</p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-3 pt-2">
                <p className="text-sm text-muted-foreground text-center">
                  Pose-moi une question sur ton activité freelance.
                </p>
                <div className="space-y-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSend(s)}
                      className="w-full text-left px-3 py-2 rounded-xl bg-muted/40 border border-border text-xs text-foreground hover:bg-muted/60 transition-colors"
                    >
                      <Sparkles className="size-3 inline mr-1.5 text-[#5682F2]" />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-2", msg.role === "user" && "justify-end")}>
                {msg.role === "assistant" && (
                  <div className="size-6 rounded-md bg-gradient-to-br from-[#5682F2] to-[#7C5BF2] flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="size-3 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                    msg.role === "user"
                      ? "bg-primary text-white rounded-br-md"
                      : "bg-muted/50 text-foreground rounded-bl-md"
                  )}
                >
                  {msg.content || (streaming && i === messages.length - 1 && (
                    <span className="inline-flex gap-1">
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
          <div className="border-t border-border p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pose ta question..."
                rows={1}
                className="flex-1 resize-none px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#5682F2]/40 max-h-24"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || streaming}
                className={cn(
                  "size-9 rounded-xl flex items-center justify-center transition-all shrink-0",
                  input.trim() && !streaming
                    ? "bg-primary text-white hover:bg-primary/90"
                    : "bg-muted/50 text-muted-foreground/40"
                )}
              >
                <Send className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
