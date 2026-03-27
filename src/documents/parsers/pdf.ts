import { readFileSync } from 'node:fs';

export async function parsePdf(filePath: string): Promise<{ text: string; pages: number; metadata: Record<string, unknown> }> {
  const pdfParse = (await import('pdf-parse')).default;
  const buffer = readFileSync(filePath);
  const data = await pdfParse(buffer);

  return {
    text: data.text,
    pages: data.numpages,
    metadata: {
      title: data.info?.Title || null,
      author: data.info?.Author || null,
      subject: data.info?.Subject || null,
      pages: data.numpages,
    },
  };
}
