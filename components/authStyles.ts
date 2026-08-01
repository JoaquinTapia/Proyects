import type { CSSProperties } from "react";

export const authStyles: Record<string, CSSProperties> = {
  wrap: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "#0f1512", padding: 20,
  },
  card: {
    background: "#161d19", border: "1px solid #2a352f", borderRadius: 12,
    padding: 32, width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 12,
  },
  eyebrow: {
    fontFamily: "monospace", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase",
    color: "#d8a33d", marginBottom: 2,
  },
  h1: { fontSize: 22, margin: "0 0 12px", color: "#e8ede9" },
  input: {
    background: "#0f1512", border: "1px solid #2a352f", borderRadius: 8,
    padding: "10px 12px", color: "#e8ede9", fontSize: 14, outline: "none",
  },
  button: {
    background: "#4fb3a9", color: "#08211d", border: "none", borderRadius: 8,
    padding: "11px", fontWeight: 700, cursor: "pointer", fontSize: 14, marginTop: 6,
  },
  error: { color: "#c1595a", fontSize: 13 },
  sub: { color: "#8ba396", fontSize: 13, marginTop: 8 },
  link: { color: "#4fb3a9", textDecoration: "none", fontWeight: 600 },
};
