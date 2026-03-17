"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MailOpen } from "@/components/ui/icons";

export default function SignupPage() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const nextUrl = plan ? `/checkout?plan=${plan}` : "/onboarding";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${nextUrl}` },
      // NOTE: Supabase dashboard "Site URL" + "Redirect URLs" must include the production domain
    });

    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo au-dessus */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.webp" alt="Freelens" className="h-14 w-auto opacity-80 hidden dark:block" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-light.webp" alt="Freelens" className="h-14 w-auto opacity-80 block dark:hidden" />
            <span className="text-3xl font-bold text-foreground">Freelens</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          {sent ? (
            <div className="text-center py-4">
              <div className="mb-3 flex justify-center">
                <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <MailOpen className="size-7 text-primary" />
                </div>
              </div>
              <h2 className="text-lg font-bold text-foreground mb-1">Check tes emails !</h2>
              <p className="text-sm text-muted-foreground">
                On a envoyé un lien de connexion à <strong className="text-foreground">{email}</strong>
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-5">
                <h1 className="text-xl font-bold text-foreground">Créer un compte</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Simule tes d&eacute;cisions en 30 secondes.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ton@email.com"
                    className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/80 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                  />
                </div>
                {error && <p className="text-sm text-[#f87171]">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? "Envoi..." : "S'inscrire avec un magic link"}
                </button>
                <p className="text-xs text-muted-foreground/80 text-center">
                  En t&apos;inscrivant, tu acceptes nos <Link href="/cgu" className="text-primary hover:underline">CGU</Link>.
                </p>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground/80 mt-4">
          Déjà un compte ?{" "}
          <Link href="/login" className="text-primary hover:underline">Connexion</Link>
        </p>
      </div>
    </div>
  );
}
