// Usa Voyage AI para generar embeddings — es el proveedor de embeddings recomendado
// por Anthropic (Claude no tiene endpoint de embeddings propio). Cuenta gratis con
// límite mensual en https://dash.voyageai.com

const VOYAGE_MODEL = "voyage-3-lite"; // rápido y económico, 512 dimensiones

export async function getEmbeddings(texts: string[]): Promise<number[][] | null> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey || texts.length === 0) return null;

  try {
    const res = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: texts.map(t => t.slice(0, 4000)), // límite razonable por texto
        model: VOYAGE_MODEL,
        input_type: "document",
      }),
    });
    if (!res.ok) {
      console.error("[embeddings] Voyage respondió", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    return data.data.map((d: any) => d.embedding);
  } catch (e) {
    console.error("[embeddings] error llamando a Voyage:", e);
    return null;
  }
}

export async function getEmbedding(text: string): Promise<number[] | null> {
  const result = await getEmbeddings([text]);
  return result ? result[0] : null;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
