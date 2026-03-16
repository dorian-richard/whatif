"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useProfileStore } from "@/stores/useProfileStore";
import { useInvoiceStore } from "@/stores/useInvoiceStore";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Sparkles, Send, Bot } from "@/components/ui/icons";
import { ProBlur } from "@/components/ProBlur";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { InvoiceDocument, DocumentItem } from "@/types";

const ALLOWED_EMAILS = ["dorich@icloud.com"];

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Analyse ma situation financière",
  "Quel est mon TJM optimal ?",
  "Dois-je passer en EURL ou SASU ?",
  "Comment optimiser ma fiscalité ?",
  "Crée une facture pour Hermès, 22 jours ce mois",
  "Combien je gagne net par mois ?",
];

export default function AssistantPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const profile = useProfileStore();
  const { documents } = useInvoiceStore();

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

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  function buildContext() {
    const activeClients = profile.clients.filter(c => c.isActive !== false);
    const totalCA = activeClients.reduce((sum, c) => {
      if (c.billing === "tjm") return sum + (c.dailyRate ?? 0) * (c.daysPerMonth ?? (c.daysPerWeek ?? 0) * 4.33) * 12;
      if (c.billing === "forfait") return sum + (c.monthlyAmount ?? 0) * 12;
      if (c.billing === "mission") return sum + (c.totalAmount ?? 0);
      return sum;
    }, 0);

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
        id: c.id,
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
      invoices: {
        total: documents.length,
        unpaid: documents.filter(d => d.type === "facture" && (d.status === "sent" || d.status === "late")).length,
        unpaidAmount: documents.filter(d => d.type === "facture" && (d.status === "sent" || d.status === "late")).reduce((s, d) => s + d.totalTTC, 0),
        drafts: documents.filter(d => d.status === "draft").length,
      },
    };
  }

  function handleAction(action: { type: string; data: Record<string, unknown> }) {
    const clients = profile.clients.filter(c => c.isActive !== false);

    if (action.type === "create_invoice" || action.type === "create_devis") {
      const clientName = (action.data.clientName as string).toLowerCase();
      const client = clients.find(c =>
        c.name.toLowerCase().includes(clientName) ||
        (c.companyName ?? "").toLowerCase().includes(clientName)
      );

      const qty = action.data.quantity as number;
      const price = action.data.unitPrice as number;
      const unit = (action.data.unit as string) ?? "jour";
      const desc = action.data.description as string;
      const totalHT = qty * price;
      const tvaRate = profile.businessStatus === "micro" ? 0 : 20;
      const totalTVA = totalHT * (tvaRate / 100);

      const item: DocumentItem = {
        id: crypto.randomUUID(),
        description: desc,
        quantity: qty,
        unitPrice: price,
        totalHT,
        sortOrder: 0,
        itemType: "tjm",
        unit,
      };

      const docType = action.type === "create_devis" ? "devis" : "facture";
      let issueDate = new Date().toISOString();
      if (action.data.month) {
        const year = (action.data.year as number) ?? new Date().getFullYear();
        issueDate = new Date(year, (action.data.month as number) - 1, 1).toISOString();
      }

      const prefill: InvoiceDocument = {
        id: "new",
        clientId: client?.id ?? "",
        type: docType,
        number: "",
        status: "draft",
        issueDate,
        dueDate: docType === "facture" ? new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) : undefined,
        validUntil: docType === "devis" ? new Date(Date.now() + ((action.data.validDays as number) ?? 30) * 86400000).toISOString().slice(0, 10) : undefined,
        totalHT,
        totalTVA,
        totalTTC: totalHT + totalTVA,
        tvaRate,
        items: [item],
        clientSnapshot: client ? {
          name: client.name,
          companyName: client.companyName,
          siret: client.siret,
          address: client.clientAddress,
          city: client.clientCity,
          zip: client.clientZip,
          email: client.email,
        } : { name: action.data.clientName as string },
      };

      sessionStorage.setItem("freelens-prefill-devis", JSON.stringify(prefill));
      router.push("/facturation");
    } else if (action.type === "navigate") {
      router.push(`/${action.data.page as string}`);
    }
  }

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || streaming) return;

    const userMessage: Message = { role: "user", content: msg };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    setMessages([...newMessages, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, context: buildContext() }),
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
        if (data.actions) {
          for (const action of data.actions as Array<{ type: string; data: Record<string, unknown> }>) {
            handleAction(action);
          }
        }
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

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 flex flex-col h-[calc(100vh-80px)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="size-6 text-[#5682F2]" />
          Assistant IA
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pose tes questions, demande des analyses ou crée des documents.
        </p>
      </div>

      <ProBlur label="L'assistant IA est réservé au plan Pro">
        <div className="flex-1 flex flex-col bg-card rounded-2xl border border-border overflow-hidden min-h-0">
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full space-y-6 py-12">
                <div className="size-16 rounded-2xl bg-gradient-to-br from-[#5682F2] to-[#7C5BF2] flex items-center justify-center">
                  <Bot className="size-8 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground mb-1">Comment puis-je t&apos;aider ?</p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Je connais ta situation : statut, clients, CA, factures. Pose-moi une question ou demande-moi d&apos;agir.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSend(s)}
                      className="text-left px-4 py-3 rounded-xl bg-muted/40 border border-border text-sm text-foreground hover:bg-muted/60 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-3", msg.role === "user" && "justify-end")}>
                {msg.role === "assistant" && (
                  <div className="size-8 rounded-lg bg-gradient-to-br from-[#5682F2] to-[#7C5BF2] flex items-center justify-center shrink-0 mt-1">
                    <Bot className="size-4 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3",
                    msg.role === "user"
                      ? "bg-primary text-white rounded-br-md text-sm whitespace-pre-wrap"
                      : "bg-muted/40 text-foreground rounded-bl-md assistant-prose"
                  )}
                >
                  {msg.content ? (
                    msg.role === "user" ? msg.content : (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-3 [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1.5 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:text-sm [&_li]:leading-relaxed [&_table]:text-xs [&_table]:my-3 [&_th]:px-3 [&_th]:py-1.5 [&_th]:bg-muted/50 [&_td]:px-3 [&_td]:py-1.5 [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_td]:border [&_td]:border-border [&_blockquote]:border-l-primary/40 [&_blockquote]:text-sm [&_blockquote]:my-2 [&_hr]:my-4 [&_strong]:text-foreground [&_code]:text-xs [&_code]:bg-muted/50 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    )
                  ) : (streaming && i === messages.length - 1 && (
                    <span className="inline-flex gap-1 py-1">
                      <span className="size-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                      <span className="size-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                      <span className="size-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          {allowed && (
            <div className="border-t border-border px-4 py-3">
              <div className="flex items-end gap-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Pose ta question ou demande une action..."
                  rows={1}
                  className="flex-1 resize-none px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#5682F2]/40 max-h-32"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || streaming}
                  className={cn(
                    "size-11 rounded-xl flex items-center justify-center transition-all shrink-0",
                    input.trim() && !streaming
                      ? "bg-gradient-to-br from-[#5682F2] to-[#7C5BF2] text-white hover:opacity-90"
                      : "bg-muted/50 text-muted-foreground/40"
                  )}
                >
                  <Send className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </ProBlur>
    </div>
  );
}
