export function Founder() {
  return (
    <section className="snap-section relative flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-[#5682F2]/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20 w-full">
        <div className="text-center mb-12">
          <span className="text-sm font-medium text-primary uppercase tracking-widest mb-3 block">
            Cr&eacute;&eacute; avec amour &agrave; Paris <span className="text-red-500">&hearts;</span>
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground">
            &mdash;
          </h2>
        </div>

        <div className="bg-card border border-border rounded-2xl p-10 sm:p-14 flex flex-col sm:flex-row items-center gap-10 sm:gap-14">
          {/* Photo */}
          <div className="shrink-0">
            <div className="size-36 sm:size-48 rounded-full overflow-hidden border-2 border-border shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/profile.jpeg"
                alt="Dorian Richard, cr&eacute;ateur de Freelens"
                className="size-full object-cover"
              />
            </div>
          </div>

          {/* Text */}
          <div className="text-center sm:text-left space-y-5">
            <h3 className="text-xl font-bold text-foreground">Dorian Richard</h3>
            <p className="text-base text-muted-foreground leading-relaxed">
              Freelance depuis 5 ans, j&apos;ai pass&eacute; des heures sur des tableurs Excel pour anticiper mes revenus,
              comparer les statuts et pr&eacute;voir ma tr&eacute;sorerie.
              J&apos;ai cr&eacute;&eacute; <strong className="text-foreground">Freelens</strong> pour que
              chaque freelance puisse prendre ses d&eacute;cisions financi&egrave;res avec clart&eacute;,
              pas au feeling.
            </p>
            <div className="flex gap-4 justify-center sm:justify-start">
              <a
                href="https://www.linkedin.com/in/dorianri/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a
                href="https://x.com/dorian__richard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="X (Twitter)"
              >
                <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
