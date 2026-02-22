"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MailOpen } from "@/components/ui/icons";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
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
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Freelens" className="h-11 w-auto opacity-80" />
            <span className="text-2xl font-bold text-foreground">Freelens</span>
          </Link>
          <h1 className="text-xl font-bold text-foreground">Connexion</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Un lien magique sera envoyé à ton email.
          </p>
        </div>

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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ton@email.com"
                  className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                />
              </div>
              {error && <p className="text-sm text-[#f87171]">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "Envoi..." : "Recevoir le lien magique"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground/60 mt-4">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="text-primary hover:underline">Inscription</Link>
        </p>
      </div>
    </div>
  );
}
