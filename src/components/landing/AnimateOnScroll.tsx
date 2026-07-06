"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface AnimateOnScrollProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  eager?: boolean;
}

export function AnimateOnScroll({ children, delay = 0, className, eager = false }: AnimateOnScrollProps) {
  // Contenu above-the-fold : rendu visible immédiatement (pas d'opacity:0 en SSR → LCP sain)
  if (eager) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
