"use client";

export function BackButton() {
  return (
    <button
      onClick={() => window.history.back()}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      &larr; Retour
    </button>
  );
}
