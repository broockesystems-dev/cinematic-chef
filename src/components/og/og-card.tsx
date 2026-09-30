// Shared 1200×630 social card, rendered by next/og (inline styles only).
export const OG_SIZE = { width: 1200, height: 630 };

type Props = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  background?: string | null;
};

export function OgCard({ eyebrow, title, subtitle, background }: Props) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: "linear-gradient(135deg, #1a1208 0%, #0b0a09 60%)",
        color: "#f6f1ea",
      }}
    >
      {background && (
        // eslint-disable-next-line @next/next/no-img-element -- rendered by next/og, not the browser
        <img
          src={background}
          alt=""
          width={1200}
          height={630}
          style={{
            position: "absolute",
            inset: 0,
            objectFit: "cover",
            opacity: 0.45,
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(0deg, rgba(11,10,9,0.95) 0%, rgba(11,10,9,0.2) 70%)",
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 72,
          gap: 16,
          width: "100%",
        }}
      >
        <div
          style={{
            fontSize: 28,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#f0a44b",
          }}
        >
          {eyebrow}
        </div>
        <div style={{ fontSize: 88, fontWeight: 700, lineHeight: 1.05 }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 34, color: "#cfc6ba" }}>{subtitle}</div>
        )}
      </div>
    </div>
  );
}
