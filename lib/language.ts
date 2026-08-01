// Detección simple de idioma (español vs inglés) basada en palabras muy comunes.
// No es perfecta, pero para textos de más de un par de frases es bastante confiable
// y evita depender de una librería externa o de una llamada extra a la IA.

const SPANISH_MARKERS = [
  " el ", " la ", " los ", " las ", " de ", " que ", " para ", " con ", " una ",
  " experiencia ", " años ", " empresa ", " trabajo ", " equipo ", " conocimientos ",
];
const ENGLISH_MARKERS = [
  " the ", " and ", " for ", " with ", " you ", " your ", " will ", " team ",
  " experience ", " years ", " company ", " work ", " role ", " skills ",
];

export function detectLanguage(text: string): "es" | "en" {
  const padded = ` ${text.toLowerCase()} `;
  let esScore = 0, enScore = 0;
  SPANISH_MARKERS.forEach(m => { if (padded.includes(m)) esScore++; });
  ENGLISH_MARKERS.forEach(m => { if (padded.includes(m)) enScore++; });
  return esScore >= enScore ? "es" : "en";
}
