import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Freelens — Le copilote financier des freelances";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #07070e 0%, #0f0f1a 50%, #07070e 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Decorative blobs */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(86,130,242,0.15) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -100,
            left: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124,91,242,0.12) 0%, transparent 70%)",
          }}
        />

        {/* Logo area */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg, #5682F2, #7C5BF2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 800,
              color: "white",
            }}
          >
            F
          </div>
          <span
            style={{
              fontSize: 42,
              fontWeight: 800,
              color: "white",
            }}
          >
            Freelens
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontSize: 48,
            fontWeight: 700,
            color: "white",
            textAlign: "center",
            lineHeight: 1.2,
            maxWidth: 800,
            marginBottom: 20,
          }}
        >
          <span>Le copilote financier</span>
          <span
            style={{
              background: "linear-gradient(90deg, #5682F2, #7C5BF2, #a78bfa)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            des freelances
          </span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 22,
            color: "rgba(255,255,255,0.5)",
            textAlign: "center",
            maxWidth: 700,
            marginBottom: 40,
          }}
        >
          Simulateur de revenus · Comparateur de statuts · Benchmark TJM
        </div>

        {/* CTA pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 28px",
            borderRadius: 100,
            background: "linear-gradient(90deg, #5682F2, #7C5BF2)",
            fontSize: 18,
            fontWeight: 600,
            color: "white",
          }}
        >
          Essai gratuit 7 jours →
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            fontSize: 16,
            color: "rgba(255,255,255,0.3)",
          }}
        >
          freelens.io
        </div>
      </div>
    ),
    { ...size }
  );
}
