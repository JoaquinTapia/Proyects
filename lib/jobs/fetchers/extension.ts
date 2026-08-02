import { NormalizedJob } from "../normalize";

/**
 * Punto de extensión para fuentes adicionales que TÚ decidas construir por tu cuenta
 * (por ejemplo, algo que lea de una tabla donde una herramienta tuya vaya dejando
 * ofertas ya capturadas). Deliberadamente no incluye nada que automatice el acceso
 * a portales que lo prohíben en sus Términos de Servicio — ver supabase/schema.sql,
 * tabla `job_postings`, columna `source`, para el formato que debe respetar
 * cualquier fetcher que agregues aquí.
 *
 * Por ahora no hace nada — está vacío a propósito.
 */
export async function fetchExtension(_role: string): Promise<NormalizedJob[]> {
  return [];
}
