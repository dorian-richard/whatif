export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto mb-4 animate-pulse">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Freelens" className="h-14 w-auto opacity-80 hidden dark:block" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-light.png" alt="Freelens" className="h-14 w-auto opacity-80 block dark:hidden" />
        </div>
        <p className="text-sm text-muted-foreground/70">Chargement...</p>
      </div>
    </div>
  );
}
