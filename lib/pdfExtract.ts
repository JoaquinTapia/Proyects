import { getDocumentProxy } from "unpdf";

type TextItem = { str: string; x: number; y: number };

function groupIntoLines(items: TextItem[]): string {
  const sorted = items.slice().sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: string[] = [];
  let currentY: number | null = null;
  let currentLine: string[] = [];
  const Y_TOLERANCE = 3;

  for (const it of sorted) {
    if (currentY === null || Math.abs(it.y - currentY) > Y_TOLERANCE) {
      if (currentLine.length) lines.push(currentLine.join(" "));
      currentLine = [it.str];
      currentY = it.y;
    } else {
      currentLine.push(it.str);
    }
  }
  if (currentLine.length) lines.push(currentLine.join(" "));
  return lines.join("\n");
}

/**
 * Extrae el texto de un PDF respetando su layout visual real (posición x/y de cada
 * fragmento de texto), en vez de solo el orden en que el PDF los almacena internamente
 * — que es la causa de que los CVs de 2 columnas salgan con el contenido mezclado.
 * Si detecta 2 columnas (típico de CVs con sidebar), extrae cada una por separado y
 * las concatena con una etiqueta clara, para que el orden de lectura sea correcto.
 */
export async function extractPdfTextByLayout(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  let fullText = "";

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();

    const items: TextItem[] = (content.items as any[])
      .filter(it => it.str && it.str.trim())
      .map(it => ({ str: it.str, x: it.transform[4], y: it.transform[5] }));

    if (items.length === 0) continue;

    // Buscar un "vacío" vertical grande en la distribución de X — señal de 2 columnas.
    const xs = items.map(it => it.x).sort((a, b) => a - b);
    let splitX: number | null = null;
    for (let i = 1; i < xs.length; i++) {
      const gap = xs[i] - xs[i - 1];
      if (gap > viewport.width * 0.1 && xs[i - 1] < viewport.width * 0.6) {
        splitX = (xs[i - 1] + xs[i]) / 2;
        break;
      }
    }

    if (splitX !== null) {
      const left = items.filter(it => it.x < splitX!);
      const right = items.filter(it => it.x >= splitX!);
      // Heurística: la columna con menos texto suele ser la barra lateral (contacto/skills),
      // así que va primero, seguida de la columna principal (experiencia).
      const [sideCol, mainCol] = left.length < right.length ? [left, right] : [right, left];
      fullText += `=== SECCIÓN LATERAL (contacto/skills/educación probablemente) ===\n${groupIntoLines(sideCol)}\n\n`;
      fullText += `=== SECCIÓN PRINCIPAL (experiencia probablemente) ===\n${groupIntoLines(mainCol)}\n\n`;
    } else {
      fullText += groupIntoLines(items) + "\n\n";
    }
  }

  return fullText.trim();
}
