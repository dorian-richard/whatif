import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { BLOG_POSTS } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog Freelens — Guides et conseils pour freelances",
  description:
    "Articles pratiques pour freelances : statuts juridiques, charges URSSAF, TJM, fiscalité. Guides complets et à jour pour optimiser ton activité.",
  alternates: { canonical: "https://freelens.io/blog" },
};

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
            Blog <span className="fn-gradient-text">Freelens</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Guides pratiques et analyses pour les freelances en France.
            Statuts, charges, TJM, fiscalit&eacute; &mdash; tout ce qu&apos;il faut savoir.
          </p>
        </div>

        <div className="space-y-6">
          {BLOG_POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block bg-card border border-border rounded-2xl p-6 sm:p-8 hover:border-primary/40 transition-colors group"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </time>
                  <span>&middot;</span>
                  <span>{post.readingTime} de lecture</span>
                </div>
                <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {post.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {post.keywords.slice(0, 4).map((kw) => (
                    <span
                      key={kw}
                      className="text-xs bg-muted px-2.5 py-1 rounded-full text-muted-foreground"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center py-4">
          <Link
            href="/signup"
            className="inline-block px-10 py-4 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-lg font-bold hover:opacity-90 transition-opacity"
          >
            Essayer Freelens gratuitement &rarr;
          </Link>
          <p className="text-sm text-muted-foreground/60 mt-3">
            Sans carte bancaire &middot; Tous les outils inclus
          </p>
        </div>

        <div className="text-xs text-muted-foreground/40 border-t border-border pt-6">
          <p>
            Voir aussi :{" "}
            <Link href="/simulateur-revenus-freelance" className="text-primary hover:underline">
              Simulateur de revenus
            </Link>
            {" "}&middot;{" "}
            <Link href="/comparateur-statuts-freelance" className="text-primary hover:underline">
              Comparateur de statuts
            </Link>
            {" "}&middot;{" "}
            <Link href="/tjm-freelance" className="text-primary hover:underline">
              TJM freelance 2026
            </Link>
            {" "}&middot;{" "}
            <Link href="/devenir-freelance" className="text-primary hover:underline">
              Devenir freelance
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
