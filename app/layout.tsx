export const metadata = {
  title: "TalentIA — Tracker de postulaciones",
  description: "Encuentra, adapta y da seguimiento a tus postulaciones",
};

// Patrón SVG con "TalentIA" repetido, rotado, muy sutil — se ve como marca de agua de fondo
const watermarkSvg = `
<svg xmlns='http://www.w3.org/2000/svg' width='220' height='110'>
  <text x='0' y='60' font-family='monospace' font-size='16' fill='#ffffff' fill-opacity='0.035'
        transform='rotate(-18 110 55)'>TalentIA</text>
</svg>`;
const watermarkDataUri = `data:image/svg+xml,${encodeURIComponent(watermarkSvg)}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{
        margin: 0, fontFamily: "Inter, system-ui, sans-serif", background: "#0f1512", color: "#e8ede9",
        backgroundImage: `url("${watermarkDataUri}")`,
        backgroundRepeat: "repeat",
        minHeight: "100vh",
      }}>
        {children}
      </body>
    </html>
  );
}
