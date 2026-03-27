import { readFileSync } from 'node:fs';

export async function parseDocx(filePath: string): Promise<{ text: string; html: string }> {
  const mammoth = await import('mammoth');
  const buffer = readFileSync(filePath);

  const textResult = await mammoth.extractRawText({ buffer });
  const htmlResult = await mammoth.convertToHtml({ buffer });

  return {
    text: textResult.value,
    html: htmlResult.value,
  };
}
