// Detecta frases comunes de "requiere autorización de trabajo/ciudadanía de [país]"
// y descarta la oferta si el usuario no es de ese país. Es heurístico (no IA), así
// que puede tener falsos positivos/negativos — mejor pecar de descartar de más
// una oferta ambigua que mostrarle al usuario algo que no puede postular.

type CountryRule = {
  country: string; // nombre "canónico" para comparar contra profile.country
  patterns: RegExp[];
};

const RULES: CountryRule[] = [
  {
    country: "estados unidos",
    patterns: [
      /must be authorized to work in the (united states|u\.s\.a?\.?|usa)/i,
      /us citizens? only/i,
      /must be a (us|u\.s\.) citizen/i,
      /green card holders? only/i,
      /require.*(us|u\.s\.) work authorization/i,
      /this position requires.*right to work in the (united states|us)/i,
    ],
  },
  {
    country: "reino unido",
    patterns: [
      /right to work in the (uk|united kingdom)( is required)?/i,
      /must have (uk|u\.k\.) work authorization/i,
    ],
  },
  {
    country: "unión europea",
    patterns: [
      /eu citizenship required/i,
      /must (be an? )?eu citizen/i,
      /right to work in the european union/i,
    ],
  },
];

// Frases que anulan el filtro (la empresa sí acepta gente de otros países)
const OVERRIDE_PATTERNS = [
  /visa sponsorship available/i,
  /we (can |will )?sponsor visas?/i,
  /open to international candidates/i,
  /remote from anywhere/i,
  /work from anywhere/i,
  /global talent/i,
  /no restrictions? on location/i,
];

const COUNTRY_ALIASES: Record<string, string[]> = {
  "estados unidos": ["estados unidos", "usa", "united states", "eeuu", "u.s.a", "us"],
  "reino unido": ["reino unido", "uk", "united kingdom", "inglaterra"],
  "unión europea": ["españa", "francia", "alemania", "italia", "portugal", "holanda", "eu", "european union"],
};

function userMatchesCountry(userCountry: string, ruleCountry: string): boolean {
  const normalized = userCountry.toLowerCase().trim();
  const aliases = COUNTRY_ALIASES[ruleCountry] || [ruleCountry];
  return aliases.some(alias => normalized.includes(alias));
}

export function shouldExcludeForVisa(jobText: string, userCountry: string | null | undefined): boolean {
  if (!userCountry) return false; // sin país configurado, no filtramos (no penalizar por falta de dato)
  if (OVERRIDE_PATTERNS.some(p => p.test(jobText))) return false;

  for (const rule of RULES) {
    if (userMatchesCountry(userCountry, rule.country)) continue; // el usuario SÍ es de ese país, no se excluye
    if (rule.patterns.some(p => p.test(jobText))) return true;
  }
  return false;
}
