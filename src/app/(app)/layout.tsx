import type { Metadata } from "next";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { ProfileSync } from "@/components/ProfileSync";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <ProfileSync />
      <AppSidebar />
      <main className="md:ml-[220px] min-h-screen pt-8 md:pt-10 pb-16 md:pb-0">
        {children}
      </main>
    </div>
  );
}
