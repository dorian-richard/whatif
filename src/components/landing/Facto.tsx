"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, Bot, Send } from "@/components/ui/icons";
import { AnimateOnScroll } from "./AnimateOnScroll";
import { cn } from "@/lib/utils";
import Link from "next/link";

const DEMO_CONVERSATION = [
  { role: "user" as const, text: "Combien je gagne vraiment avec 95k de CA ?" },
  { role: "assistant" as const, text: "Avec **95 000 EUR de CA** en micro-entreprise :\n\n- Cotisations URSSAF (23,1%) : **-21 945 EUR**\n- Impot sur le revenu : **-8 120 EUR**\n\n**Net apres tout : 64 935 EUR**, soit **5 411 EUR/mois**.\n\nTu veux que je compare avec une EURL a l'IS ?" },
  { role: "user" as const, text: "Oui, compare avec EURL IS" },
  { role: "assistant" as const, text: "**EURL IS** avec 2 800 EUR de salaire + dividendes :\n\n| | Micro | EURL IS |\n|---|---|---|\n| CA | 95 000 EUR | 95 000 EUR |\n| Net | 64 935 EUR | 68 210 EUR |\n| Net/mois | 5 411 EUR | 5 684 EUR |\n\n**Gain : +3 275 EUR/an** en passant en EURL IS.\nLe seuil de rentabilite est a ~72 000 EUR de CA." },
];

const CAPABILITIES = [
  { label: "Calculs personnalises", desc: "Revenus nets, charges, impots avec tes vrais chiffres" },
  { label: "Comparaison de statuts", desc: "Micro, EURL, SASU — chiffres concrets, pas de generalites" },
  { label: "Actions directes", desc: "Cree factures et devis en une phrase" },
  { label: "Provisions", desc: "Combien mettre de cote chaque mois, au centime pres" },
];

export function Facto() {
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasStarted) return;
    if (visibleMessages >= DEMO_CONVERSATION.length) return;

    const msg = DEMO_CONVERSATION[visibleMessages];
    const delay = msg.role === "user" ? 800 : 1500;

    setIsTyping(true);
    const timer = setTimeout(() => {
      setIsTyping(false);
      setVisibleMessages((v) => v + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [visibleMessages, hasStarted]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !hasStarted) setHasStarted(true); },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  return (
    <section ref={sectionRef} className="snap-section relative flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#7C5BF2]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-[#5682F2]/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 w-full">
        <AnimateOnScroll>
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-widest mb-3 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] bg-clip-text text-transparent">
              <Sparkles className="size-4 text-[#5682F2]" />
              Assistant IA
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Rencontre{" "}
              <span className="fn-gradient-text">Facto</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Ton expert-comptable IA, disponible 24h/24. Il connait ton CA, tes clients, ton statut — et repond avec tes vrais chiffres.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Chat demo */}
          <AnimateOnScroll delay={0.1}>
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-gradient-to-r from-[#5682F2]/10 to-[#7C5BF2]/10">
                <div className="size-8 rounded-lg bg-gradient-to-br from-[#5682F2] to-[#7C5BF2] flex items-center justify-center">
                  <Bot className="size-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Facto</p>
                  <p className="text-[10px] text-muted-foreground">Copilote financier IA</p>
                </div>
                <span className="ml-auto text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-[#5682F2] to-[#F4BE7E] text-white px-2 py-0.5 rounded-full">
                  Pro
                </span>
              </div>

              {/* Messages */}
              <div className="px-4 py-4 space-y-3 min-h-[320px] max-h-[400px] overflow-y-auto">
                {DEMO_CONVERSATION.slice(0, visibleMessages).map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300",
                      msg.role === "user" && "justify-end"
                    )}
                  >
                    {msg.role === "assistant" && (
                      <div className="size-6 rounded-md bg-gradient-to-br from-[#5682F2] to-[#7C5BF2] flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="size-3 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                        msg.role === "user"
                          ? "bg-primary text-white rounded-br-md"
                          : "bg-muted/50 text-foreground rounded-bl-md"
                      )}
                    >
                      {msg.text.split("\n").map((line, li) => {
                        if (line.startsWith("|")) {
                          const cells = line.split("|").filter(Boolean).map(c => c.trim());
                          if (cells.every(c => c.match(/^-+$/))) return null;
                          const isHeader = li > 0 && msg.text.split("\n")[li + 1]?.includes("---");
                          return (
                            <div key={li} className={cn("grid grid-cols-3 gap-1 text-xs", isHeader ? "font-semibold border-b border-border pb-1 mb-1" : "")}>
                              {cells.map((c, ci) => <span key={ci}>{c}</span>)}
                            </div>
                          );
                        }
                        const formatted = line
                          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                          .replace(/^- /, '&bull; ');
                        return <p key={li} className={cn("text-sm leading-relaxed", li > 0 && "mt-1")} dangerouslySetInnerHTML={{ __html: formatted || "&nbsp;" }} />;
                      })}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-2">
                    {DEMO_CONVERSATION[visibleMessages]?.role === "assistant" && (
                      <div className="size-6 rounded-md bg-gradient-to-br from-[#5682F2] to-[#7C5BF2] flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="size-3 text-white" />
                      </div>
                    )}
                    <div className={cn(
                      "rounded-2xl px-3 py-2",
                      DEMO_CONVERSATION[visibleMessages]?.role === "user"
                        ? "ml-auto bg-primary/80 rounded-br-md"
                        : "bg-muted/50 rounded-bl-md"
                    )}>
                      <span className="inline-flex gap-1">
                        <span className="size-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                        <span className="size-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                        <span className="size-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Fake input */}
              <div className="border-t border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs text-muted-foreground/50">
                    Demande a Facto...
                  </div>
                  <div className="size-8 rounded-xl bg-muted/50 flex items-center justify-center">
                    <Send className="size-3.5 text-muted-foreground/40" />
                  </div>
                </div>
              </div>
            </div>
          </AnimateOnScroll>

          {/* Capabilities */}
          <div className="space-y-5">
            <AnimateOnScroll delay={0.15}>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Il ne devine pas. Il calcule.
              </h3>
              <p className="text-muted-foreground text-sm mb-6">
                Facto a acces a tout ton profil Freelens. Chaque reponse est basee sur tes donnees reelles, pas sur des moyennes du marche.
              </p>
            </AnimateOnScroll>

            {CAPABILITIES.map((cap, i) => (
              <AnimateOnScroll key={cap.label} delay={0.1 + 0.05 * i}>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border hover:bg-muted/50 transition-colors">
                  <div className="size-10 rounded-xl bg-gradient-to-br from-[#5682F2]/15 to-[#7C5BF2]/15 flex items-center justify-center shrink-0">
                    <Sparkles className="size-5 text-[#5682F2]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-0.5">{cap.label}</h4>
                    <p className="text-xs text-muted-foreground">{cap.desc}</p>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}

            <AnimateOnScroll delay={0.35}>
              <Link
                href="#pricing"
                className="inline-flex items-center gap-2 mt-2 px-6 py-3 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <Sparkles className="size-4" />
                Essayer Facto — Plan Pro
              </Link>
            </AnimateOnScroll>
          </div>
        </div>
      </div>
    </section>
  );
}
