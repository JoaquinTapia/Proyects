type LogoProps = {
  size?: number;       // alto del ícono en px
  showWordmark?: boolean;
  color?: "dark" | "light"; // "dark" = para fondos oscuros (default), "light" = para fondos claros
};

/**
 * Logo de TalentIA: tres nodos conectados (el motivo de "pipeline" del producto:
 * Nuevo → Revisando → Postulado) integrados en la forma de una "T", junto al wordmark.
 */
export default function Logo({ size = 28, showWordmark = true, color = "dark" }: LogoProps) {
  const amber = "#d8a33d";
  const cyan = "#4fb3a9";
  const wordColor = color === "dark" ? "#e8ede9" : "#1a231f";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Barra horizontal de la "T", como el riel del pipeline */}
        <path d="M6 12H34" stroke={cyan} strokeWidth="2.5" strokeLinecap="round" />
        {/* Tallo vertical de la "T" */}
        <path d="M20 12V34" stroke={cyan} strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
        {/* Tres nodos sobre el riel: el motivo de pipeline del producto */}
        <circle cx="6" cy="12" r="4.5" fill="#121815" stroke={cyan} strokeWidth="2" />
        <circle cx="20" cy="12" r="4.5" fill={amber} />
        <circle cx="34" cy="12" r="4.5" fill="#121815" stroke={amber} strokeWidth="2" />
      </svg>
      {showWordmark && (
        <span style={{ fontFamily: "monospace", fontSize: size * 0.62, fontWeight: 700, color: wordColor, letterSpacing: "-0.01em" }}>
          talent<span style={{ color: amber }}>IA</span>
        </span>
      )}
    </div>
  );
}
