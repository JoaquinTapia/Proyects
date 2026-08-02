import { NormalizedJob } from "./normalize";

export const MAX_PER_SOURCE_ROLE = 15;

/** Crea un contador por fuente para topar cuántos candidatos aceptamos de cada una. */
export function createSourceCapper(max: number = MAX_PER_SOURCE_ROLE) {
  let count = 0;
  return {
    canAcceptMore(): boolean { return count < max; },
    accept(): void { count++; },
  };
}

/** Ordena candidatos por fecha de publicación, más reciente primero (los que la tengan). */
export function sortByRecency(jobs: NormalizedJob[]): NormalizedJob[] {
  return jobs.slice().sort((a, b) => {
    const da = a.posted_at ? new Date(a.posted_at).getTime() : 0;
    const db = b.posted_at ? new Date(b.posted_at).getTime() : 0;
    return db - da;
  });
}
