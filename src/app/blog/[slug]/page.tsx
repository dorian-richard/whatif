import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { getPostBySlug, getAllSlugs } from "@/lib/blog";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.title} — Freelens`,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `https://freelens.io/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      url: `https://freelens.io/blog/${post.slug}`,
    },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    url: `https://freelens.io/blog/${post.slug}`,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: "Freelens", url: "https://freelens.io" },
    publisher: {
      "@type": "Organization",
      name: "Freelens",
      logo: { "@type": "ImageObject", url: "https://freelens.io/logo.webp" },
    },
    keywords: post.keywords.join(", "),
  };

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/blog" className="hover:text-foreground transition-colors">
            Blog
          </Link>
          <span>/</span>
          <span className="text-foreground truncate">{post.title}</span>
        </div>

        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
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
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
            {post.title}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">{post.description}</p>
        </div>

        {/* Table of contents */}
        <nav className="bg-card border border-border rounded-2xl p-6 space-y-2">
          <div className="text-sm font-semibold text-foreground mb-3">Sommaire</div>
          {post.sections.map((section, i) => (
            <a
              key={i}
              href={`#section-${i}`}
              className="block text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {i + 1}. {section.title}
            </a>
          ))}
        </nav>

        {/* Sections */}
        {post.sections.map((section, i) => (
          <div key={i} id={`section-${i}`} className="space-y-4 scroll-mt-8">
            <h2 className="text-xl font-bold text-foreground">{section.title}</h2>
            <div
              className="text-sm text-muted-foreground leading-relaxed space-y-3 blog-content"
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
          </div>
        ))}

        {/* CTA */}
        <div className="text-center space-y-4 py-4">
          <Link
            href={post.cta.href}
            className="inline-block px-10 py-4 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-lg font-bold hover:opacity-90 transition-opacity"
          >
            {post.cta.text} &rarr;
          </Link>
          <p className="text-sm text-muted-foreground/80">{post.cta.sub}</p>
        </div>

        {/* Related links */}
        <div className="text-xs text-muted-foreground/80 border-t border-border pt-6 space-y-2">
          <p>
            Voir aussi :{" "}
            {post.relatedLinks.map((link, i) => (
              <span key={link.href}>
                {i > 0 && <> &middot; </>}
                <Link href={link.href} className="text-primary hover:underline">
                  {link.label}
                </Link>
              </span>
            ))}
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
