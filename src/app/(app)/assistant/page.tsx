"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useProfileStore } from "@/stores/useProfileStore";
import { useInvoiceStore } from "@/stores/useInvoiceStore";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Send, Bot, Plus, MessageCircle, Trash2, PanelLeftOpen, PanelLeftClose } from "@/components/ui/icons";
import { ProBlur } from "@/components/ProBlur";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { InvoiceDocument, DocumentItem } from "@/types";


interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
}

const SUGGESTIONS = [
  { label: "Combien je gagne vraiment ?", prompt: "Avec mon CA actuel, combien il me reste net après charges et impôts ? Détaille le calcul étape par étape." },
  { label: "Quel statut choisir ?", prompt: "Avec mon niveau de CA, est-ce que je devrais rester en micro ou passer en EURL/SASU ? Compare les 3 en chiffres concrets." },
  { label: "Mon TJM est-il bon ?", prompt: "Est-ce que mon TJM actuel est cohérent avec le marché et mes objectifs de revenu ? Que devrais-je viser ?" },
  { label: "Facture ce mois-ci", prompt: "Crée la facture pour mon client principal, pour le mois en cours." },
  { label: "Combien mettre de cote ?", prompt: "Combien je dois provisionner chaque mois pour les charges, impôts et cotisations ? Donne-moi les montants exacts." },
  { label: "Augmenter mon tarif", prompt: "Comment justifier une augmentation de TJM auprès de mon client ? Donne-moi des arguments et un exemple de message." },
  { label: "Combien me verser ce mois ?", prompt: "Combien je peux me verser ce mois-ci en restant confortable ? Prends en compte mes charges, impôts et provisions à venir." },
];

export default function AssistantPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const profile = useProfileStore();
  const { documents } = useInvoiceStore();

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setAllowed(true);
        loadConversations();
      }
    }
    check();
  }, []);

  async function loadConversations() {
    const res = await fetch("/api/conversations");
    if (res.ok) {
      const data = await res.json();
      setConversations(data);
    }
  }

  async function loadMessages(conversationId: string) {
    const res = await fetch(`/api/conversations/messages?conversationId=${conversationId}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.map((m: { role: string; content: string }) => ({ role: m.role as "user" | "assistant", content: m.content })));
      setActiveConversationId(conversationId);
    }
  }

  async function createConversation(title: string): Promise<string | null> {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (res.ok) {
      const data = await res.json();
      await loadConversations();
      return data.id;
    }
    return null;
  }

  async function saveMessages(conversationId: string, msgs: Message[]) {
    await fetch("/api/conversations/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, messages: msgs }),
    });
  }

  async function deleteConversation(id: string) {
    await fetch("/api/conversations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setMessages([]);
    }
    await loadConversations();
  }

  function handleNewConversation() {
    setActiveConversationId(null);
    setMessages([]);
    setShowSidebar(false);
    inputRef.current?.focus();
  }

  async function handleSelectConversation(id: string) {
    await loadMessages(id);
    setShowSidebar(false);
  }

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
      businessStatus: profile.businessStatus, role: profile.role, companyName: profile.companyName,
      monthlyExpenses: profile.monthlyExpenses, savings: profile.savings, workDaysPerWeek: profile.workDaysPerWeek,
      age: profile.age, monthlySalary: profile.monthlySalary, nbParts: profile.nbParts, chargesPro: profile.chargesPro,
      clients: activeClients.map(c => ({
        id: c.id, name: c.name, companyName: c.companyName, billing: c.billing,
        dailyRate: c.dailyRate, daysPerWeek: c.daysPerWeek, daysPerMonth: c.daysPerMonth,
        monthlyAmount: c.monthlyAmount, totalAmount: c.totalAmount, isActive: c.isActive,
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
      const client = clients.find(c => c.name.toLowerCase().includes(clientName) || (c.companyName ?? "").toLowerCase().includes(clientName));
      const qty = action.data.quantity as number;
      const price = action.data.unitPrice as number;
      const totalHT = qty * price;
      const tvaRate = profile.businessStatus === "micro" ? 0 : 20;
      const item: DocumentItem = { id: crypto.randomUUID(), description: action.data.description as string, quantity: qty, unitPrice: price, totalHT, sortOrder: 0, itemType: "tjm", unit: (action.data.unit as string) ?? "jour" };
      const docType = action.type === "create_devis" ? "devis" : "facture";
      let issueDate = new Date().toISOString();
      if (action.data.month) { const year = (action.data.year as number) ?? new Date().getFullYear(); issueDate = new Date(year, (action.data.month as number) - 1, 1).toISOString(); }
      const prefill: InvoiceDocument = {
        id: "new", clientId: client?.id ?? "", type: docType, number: "", status: "draft", issueDate,
        dueDate: docType === "facture" ? new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) : undefined,
        validUntil: docType === "devis" ? new Date(Date.now() + ((action.data.validDays as number) ?? 30) * 86400000).toISOString().slice(0, 10) : undefined,
        totalHT, totalTVA: totalHT * (tvaRate / 100), totalTTC: totalHT * (1 + tvaRate / 100), tvaRate, items: [item],
        clientSnapshot: client ? { name: client.name, companyName: client.companyName, siret: client.siret, address: client.clientAddress, city: client.clientCity, zip: client.clientZip, email: client.email } : { name: action.data.clientName as string },
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
    setMessages([...newMessages, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    // Create conversation if new
    let convId = activeConversationId;
    if (!convId) {
      const title = msg.length > 50 ? msg.slice(0, 50) + "..." : msg;
      convId = await createConversation(title);
      if (convId) setActiveConversationId(convId);
    }

    let assistantContent = "";

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, context: buildContext() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erreur" }));
        assistantContent = `Erreur : ${err.error}`;
        setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content: assistantContent }; return u; });
        setStreaming(false);
        if (convId) saveMessages(convId, [userMessage, { role: "assistant", content: assistantContent }]);
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
                  setMessages(prev => {
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
        setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content: assistantContent }; return u; });
        if (data.actions) {
          for (const action of data.actions) handleAction(action);
        }
      }
    } catch {
      assistantContent = "Erreur de connexion. Réessaie.";
      setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content: assistantContent }; return u; });
    }

    // Save both messages to DB
    if (convId && assistantContent) {
      saveMessages(convId, [userMessage, { role: "assistant", content: assistantContent }]);
      loadConversations();
    }

    setStreaming(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const proseClasses = "prose prose-sm dark:prose-invert max-w-none [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1.5 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:my-2.5 [&_ul]:my-2 [&_ol]:my-2 [&_li]:text-sm [&_li]:leading-relaxed [&_li]:my-0.5 [&_table]:text-xs [&_table]:my-4 [&_table]:w-full [&_th]:px-3 [&_th]:py-2 [&_th]:bg-muted/60 [&_th]:text-left [&_th]:font-semibold [&_td]:px-3 [&_td]:py-2 [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_td]:border [&_td]:border-border [&_blockquote]:border-l-2 [&_blockquote]:border-l-primary/40 [&_blockquote]:pl-4 [&_blockquote]:text-sm [&_blockquote]:my-3 [&_blockquote]:text-muted-foreground [&_hr]:my-5 [&_hr]:border-border [&_strong]:text-foreground [&_code]:text-xs [&_code]:bg-muted/60 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md";

  return (
    <div className="fixed inset-0 md:left-[220px] flex bg-background">
      {/* Conversation sidebar */}
      <div className={cn(
        "absolute md:relative inset-y-0 left-0 z-20 w-64 bg-card border-r border-border flex flex-col transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
        showSidebar ? "translate-x-0 opacity-100" : "-translate-x-full md:-translate-x-0 md:w-0 md:min-w-0 md:overflow-hidden md:border-0 md:opacity-0"
      )}>
        <div className="flex-1 overflow-y-auto py-1">
          {conversations.map((c) => (
            <div
              key={c.id}
              className={cn(
                "group flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors",
                activeConversationId === c.id && "bg-muted/60"
              )}
              onClick={() => handleSelectConversation(c.id)}
            >
              <MessageCircle className="size-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-foreground truncate flex-1">{c.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
          {conversations.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8 px-4">
              Tes conversations apparaitront ici
            </p>
          )}
        </div>
        <div className="px-3 py-3 border-t border-border shrink-0">
          <button
            onClick={handleNewConversation}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors justify-center"
          >
            <Plus className="size-3.5" />
            Nouvelle conversation
          </button>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {showSidebar && (
        <div className="fixed inset-0 bg-black/30 z-10 md:hidden" onClick={() => setShowSidebar(false)} />
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border shrink-0">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title={showSidebar ? "Masquer les conversations" : "Afficher les conversations"}
          >
            {showSidebar ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
          </button>
          <span className="text-sm font-medium text-foreground">Facto</span>
          <button
            onClick={handleNewConversation}
            className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
            title="Nouvelle conversation"
          >
            <Plus className="size-4" />
          </button>
        </div>

        <ProBlur label="L'assistant IA est réservé au plan Pro">
          <div className="flex-1 flex flex-col min-h-0">
            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 md:px-12 lg:px-20 py-6 space-y-5">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full space-y-6">
                  <div className="size-14 rounded-2xl bg-gradient-to-br from-[#5682F2] to-[#7C5BF2] flex items-center justify-center">
                    <Bot className="size-7 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-foreground mb-1">Facto</p>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Ton copilote financier. Je connais ton statut, tes clients et tes factures.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-2xl">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s.label}
                        onClick={() => handleSend(s.prompt)}
                        className="text-left px-3 py-3 rounded-xl bg-muted/30 border border-border text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={cn("max-w-4xl mx-auto w-full flex gap-3", msg.role === "user" && "justify-end")}>
                  {msg.role === "assistant" && (
                    <div className="size-7 rounded-lg bg-gradient-to-br from-[#5682F2] to-[#7C5BF2] flex items-center justify-center shrink-0 mt-1">
                      <Bot className="size-3.5 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-2xl",
                      msg.role === "user"
                        ? "max-w-[70%] bg-primary text-white rounded-br-md text-sm whitespace-pre-wrap px-4 py-2.5"
                        : "max-w-[90%] bg-muted/30 text-foreground rounded-bl-md px-5 py-4"
                    )}
                  >
                    {msg.content ? (
                      msg.role === "user" ? msg.content : (
                        <div className={proseClasses}>
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

            {/* Input — fixed bottom */}
            {allowed && (
              <div className="border-t border-border bg-background px-6 md:px-12 lg:px-20 py-3 shrink-0">
                <div className="max-w-4xl mx-auto flex items-end gap-3">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Demande a Facto..."
                    rows={1}
                    className="flex-1 resize-none px-4 py-3 bg-muted/40 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#5682F2]/40 max-h-32"
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
    </div>
  );
}
