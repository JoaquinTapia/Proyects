/** Deduplicador simple por apply_url, para usar dentro de una sola corrida de búsqueda. */
export function createDeduper() {
  const seen = new Set<string>();
  return {
    isDuplicate(url: string): boolean {
      if (seen.has(url)) return true;
      seen.add(url);
      return false;
    },
  };
}
