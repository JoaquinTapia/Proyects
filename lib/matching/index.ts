// Calcula qué tanto calza una oferta con el perfil del usuario, en una escala de 0 a 5.
// Es un cálculo simple por superposición de palabras clave (no usa IA, así que es gratis
// y rápido) — sirve como un primer filtro visual antes de decidir generar el CV con Claude.

import { cosineSimilarity } from "../embeddings";

/**
 * Versión "robusta" del match usando embeddings (similitud semántica real, no solo
 * palabras exactas) — detecta que "Ingeniero de Datos" calza con "Data Engineer",
 * o que "liderazgo de equipos" calza con "gestión de personas", cosas que el método
 * por palabras clave no puede ver. Requiere que ambos (perfil y oferta) ya tengan
 * su embedding calculado; si falta alguno, usar computeMatchScore() como respaldo.
 */
export function computeEmbeddingMatchScore(profileEmbedding: number[], jobEmbedding: number[]): number {
  const similarity = cosineSimilarity(profileEmbedding, jobEmbedding); // rango típico ~0.2 a ~0.9
  // Reescalamos: la similitud coseno rara vez baja de 0.15 o supera 0.85 en la práctica,
  // así que estiramos ese rango a 0-5 estrellas para que el puntaje sea legible.
  const normalized = Math.max(0, Math.min(1, (similarity - 0.15) / (0.85 - 0.15)));
  return Math.round(normalized * 5 * 10) / 10;
}


function extractKeywords(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-záéíóúñ0-9\s]/gi, " ")
    .split(/\s+/)
    .filter(w => w.length > 3);
}

const STOPWORDS = new Set([
  "para", "como", "esto", "esta", "estos", "estas", "sobre", "entre", "desde",
  "hacia", "hasta", "cuando", "donde", "porque", "también", "tambien", "años",
  "with", "that", "this", "from", "have", "your", "will", "team", "work",
]);

// Palabras "genéricas" de cargo que no bastan por sí solas para decidir relevancia
// (ej. "engineer" solo aparece en miles de roles que no tienen nada que ver).
const GENERIC_ROLE_WORDS = new Set([
  "engineer", "engineering", "analyst", "scientist", "specialist", "developer",
  "manager", "lead", "architect", "senior", "junior", "staff", "principal",
  "ingeniero", "ingeniera", "analista", "científico", "cientifica", "especialista",
  "desarrollador", "desarrolladora", "gerente", "líder", "lider",
]);

// Sinónimos simples ES/EN para las palabras "de dominio" más comunes en tech.
// Se usa tanto para ampliar la búsqueda como para no descartar ofertas en el otro idioma.
const SYNONYMS: Record<string, string[]> = {
  data: ["datos", "data"],
  datos: ["data", "datos"],
  machine: ["machine", "aprendizaje"],
  learning: ["learning", "aprendizaje", "automático", "automatico"],
  software: ["software"],
  product: ["producto", "product"],
  producto: ["product", "producto"],
};

function expandWithSynonyms(word: string): string[] {
  return [word, ...(SYNONYMS[word] || [])];
}

/** Palabras "de dominio" de un rol: quita las genéricas (engineer/analyst/etc). */
function domainTokens(role: string): string[] {
  const tokens = extractKeywords(role).filter(w => !STOPWORDS.has(w));
  const domain = tokens.filter(w => !GENERIC_ROLE_WORDS.has(w));
  return domain.length > 0 ? domain : tokens; // si el rol es solo "Engineer", usamos igual esas palabras
}

/**
 * ¿Esta oferta es relevante para el rol buscado?
 * Exige que TODAS las palabras "de dominio" del rol (ej. "data", "machine"+"learning")
 * aparezcan en el texto de la oferta — en español o inglés gracias a los sinónimos.
 * Las palabras genéricas de cargo (engineer/analyst/...) no son obligatorias solas.
 */
export function isRelevantForRole(jobText: string, role: string): boolean {
  const domain = domainTokens(role);
  if (domain.length === 0) return true;

  const jobLower = jobText.toLowerCase();
  return domain.every(word =>
    expandWithSynonyms(word).some(variant => jobLower.includes(variant))
  );
}

/**
 * Calcula qué tanto calza una oferta con el perfil del usuario, en una escala de 0 a 5.
 * Combina: (a) cobertura de palabras clave del CV/rol sobre la oferta, con un denominador
 * más chico para que los puntajes sean legibles, y (b) un bono si el título de la oferta
 * contiene directamente las palabras de dominio del rol buscado.
 */
export function computeMatchScore(params: {
  profileText: string;
  targetRoles: string[];
  jobText: string;
  matchedRole?: string; // el rol específico de preferences.target_roles que gatilló esta oferta
}): number {
  const { profileText, targetRoles, jobText, matchedRole } = params;

  const profileWords = new Set(
    [...extractKeywords(profileText), ...extractKeywords(targetRoles.join(" "))]
      .filter(w => !STOPWORDS.has(w))
  );

  const jobWords = new Set(extractKeywords(jobText).filter(w => !STOPWORDS.has(w)));
  if (jobWords.size === 0 || profileWords.size === 0) return 1.0;

  let matches = 0;
  jobWords.forEach(w => { if (profileWords.has(w)) matches++; });

  // Cobertura: de las palabras relevantes de la oferta, ¿cuántas aparecen en tu perfil?
  const denom = Math.min(jobWords.size, 20); // se satura para no exigir match total
  const coverage = matches / denom;

  let score = coverage * 4; // hasta 4 estrellas por cobertura de palabras

  // Bono por match directo de rol (ej. la oferta dice "Data Engineer" y tú buscas eso)
  if (matchedRole && isRelevantForRole(jobText, matchedRole)) {
    score += 1.2;
  }

  return Math.round(Math.min(5, Math.max(0.5, score)) * 10) / 10;
}

