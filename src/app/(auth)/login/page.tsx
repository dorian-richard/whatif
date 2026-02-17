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
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding` },
    });

    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#07070e] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Freelens" className="h-11 w-auto opacity-80" />
            <span className="text-2xl font-bold text-white">Freelens</span>
          </Link>
          <h1 className="text-xl font-bold text-white">Connexion</h1>
          <p className="text-sm text-[#8b8b9e] mt-1">
            Un lien magique sera envoyé à ton email.
          </p>
        </div>

        <div className="bg-[#12121c] rounded-2xl p-6 border border-white/[0.06]">
          {sent ? (
            <div className="text-center py-4">
              <div className="mb-3 flex justify-center">
                <div className="size-14 rounded-2xl bg-[#5682F2]/10 flex items-center justify-center">
                  <MailOpen className="size-7 text-[#5682F2]" />
                </div>
              </div>
              <h2 className="text-lg font-bold text-white mb-1">Check tes emails !</h2>
              <p className="text-sm text-[#8b8b9e]">
                On a envoyé un lien de connexion à <strong className="text-white">{email}</strong>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#8b8b9e] block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ton@email.com"
                  className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.1] rounded-xl text-sm text-white placeholder:text-[#5a5a6e] focus:outline-none focus:ring-2 focus:ring-[#5682F2]/30 focus:border-[#5682F2]/50"
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

        <p className="text-center text-xs text-[#5a5a6e] mt-4">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="text-[#5682F2] hover:underline">Inscription</Link>
        </p>
      </div>
    </div>
  );
}
