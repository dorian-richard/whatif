"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border py-6 px-4 sm:px-6 mt-12">
      <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.webp" alt="Freelens" className="h-5 w-auto opacity-70 hidden dark:block" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-light.webp" alt="Freelens" className="h-5 w-auto opacity-70 block dark:hidden" />
          <Link href="/" className="text-sm text-muted-foreground/80 hover:text-foreground transition-colors">
            Freelens
          </Link>
        </div>
        <div className="flex flex-wrap gap-4 sm:gap-6 justify-center text-sm text-muted-foreground/80">
          <Link href="/cgu" className="hover:text-foreground transition-colors">CGU</Link>
          <Link href="/cgv" className="hover:text-foreground transition-colors">CGV</Link>
          <Link href="/mentions-legales" className="hover:text-foreground transition-colors">Mentions l&eacute;gales</Link>
          <Link href="/confidentialite" className="hover:text-foreground transition-colors">Confidentialit&eacute;</Link>
          <button onClick={() => window.dispatchEvent(new Event("freelens-open-cookie-settings"))} className="hover:text-foreground transition-colors">G&eacute;rer les cookies</button>
          <a href="mailto:contact@freelens.io" className="hover:text-foreground transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  );
}
