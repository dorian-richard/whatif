"use client";

import { useRouter } from "next/navigation";
import { useProfileStore } from "@/stores/useProfileStore";
import { Slider } from "@/components/ui/slider";
import { fmt } from "@/lib/utils";

export default function SettingsPage() {
  const router = useRouter();
  const profile = useProfileStore();

  const handleUpgrade = async (plan: "monthly" | "annual") => {
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      console.error("Checkout error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => router.push("/simulator")} className="text-gray-400 hover:text-gray-600">&larr;</button>
          <h1 className="text-lg font-bold text-gray-900">Parametres</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
        {/* Profile */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-800 mb-5">Profil freelance</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">📅 Jours de travail / semaine</label>
                <span className="text-sm font-bold text-indigo-600">{profile.workDaysPerWeek}j</span>
              </div>
              <Slider value={[profile.workDaysPerWeek]} onValueChange={([v]) => profile.setProfile({ workDaysPerWeek: v })} min={3} max={6} step={1} />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">📋 Heures admin / semaine</label>
                <span className="text-sm font-bold text-indigo-600">{profile.adminHoursPerWeek}h</span>
              </div>
              <Slider value={[profile.adminHoursPerWeek]} onValueChange={([v]) => profile.setProfile({ adminHoursPerWeek: v })} min={0} max={20} step={1} />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">🧾 Charges mensuelles</label>
                <span className="text-sm font-bold text-indigo-600">{fmt(profile.monthlyExpenses)}&euro;</span>
              </div>
              <Slider value={[profile.monthlyExpenses]} onValueChange={([v]) => profile.setProfile({ monthlyExpenses: v })} min={500} max={6000} step={100} />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">🏦 Epargne de securite</label>
                <span className="text-sm font-bold text-indigo-600">{fmt(profile.savings)}&euro;</span>
              </div>
              <Slider value={[profile.savings]} onValueChange={([v]) => profile.setProfile({ savings: v })} min={0} max={60000} step={1000} />
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-800 mb-4">Abonnement</h2>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-4">
            <div>
              <span className="text-sm font-semibold text-gray-900">Plan Free</span>
              <p className="text-xs text-gray-400">3 clients, 1 scenario sauvegarde</p>
            </div>
            <span className="text-xs font-medium text-gray-400 bg-gray-200 px-2 py-1 rounded-full">Gratuit</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleUpgrade("monthly")} className="p-4 border-2 border-indigo-600 rounded-xl text-center hover:bg-indigo-50 transition-colors">
              <div className="text-lg font-bold text-indigo-600">9&euro;/mois</div>
              <div className="text-xs text-gray-400">Mensuel</div>
            </button>
            <button onClick={() => handleUpgrade("annual")} className="p-4 border-2 border-indigo-600 rounded-xl text-center bg-indigo-50 hover:bg-indigo-100 transition-colors relative">
              <span className="absolute -top-2 right-2 text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">-26%</span>
              <div className="text-lg font-bold text-indigo-600">79&euro;/an</div>
              <div className="text-xs text-gray-400">2 mois offerts</div>
            </button>
          </div>
        </div>

        {/* Quick links */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-800 mb-4">Clients</h2>
          <button onClick={() => router.push("/onboarding")} className="w-full py-3 bg-gray-50 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            Modifier mes clients &rarr;
          </button>
        </div>

        {/* Danger zone */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100">
          <h2 className="text-sm font-bold text-red-600 mb-4">Zone danger</h2>
          <button className="px-4 py-2 text-sm text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
            Supprimer mon compte
          </button>
        </div>
      </div>
    </div>
  );
}
