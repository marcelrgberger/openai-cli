import { readFileSync, mkdtempSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseImage } from './image.js';

export async function parsePdf(filePath: string): Promise<{ text: string; pages: number; metadata: Record<string, unknown> }> {
  const pdfParse = (await import('pdf-parse')).default;
  const buffer = readFileSync(filePath);
  const data = await pdfParse(buffer);

  const text = data.text.trim();

  // If pdf-parse extracted real text, use it
  if (text.length > 50) {
    return {
      text,
      pages: data.numpages,
      metadata: {
        title: data.info?.Title || null,
        author: data.info?.Author || null,
        subject: data.info?.Subject || null,
        pages: data.numpages,
      },
    };
  }

  // Scanned PDF — try OCR fallback
  const ocrText = await ocrPdfPages(filePath, data.numpages);

  return {
    text: ocrText || '(Scanned PDF — OCR could not extract text)',
    pages: data.numpages,
    metadata: {
      title: data.info?.Title || null,
      author: data.info?.Author || null,
      subject: data.info?.Subject || null,
      pages: data.numpages,
      ocr: true,
    },
  };
}

async function ocrPdfPages(filePath: string, pageCount: number): Promise<string> {
  const tempDir = mkdtempSync(join(tmpdir(), 'askapro-pdf-ocr-'));

  // Try converting PDF pages to images using macOS sips/qlmanage
  try {
    // Use qlmanage to generate thumbnails (works on macOS)
    execFileSync('qlmanage', ['-t', '-s', '2000', '-o', tempDir, filePath], {
      stdio: 'pipe',
      timeout: 30000,
    });
  } catch {
    // Fallback: try pdftoppm if available (from poppler)
    try {
      execFileSync('pdftoppm', ['-png', '-r', '300', filePath, join(tempDir, 'page')], {
        stdio: 'pipe',
        timeout: 60000,
      });
    } catch {
      return '';
    }
  }

  // Find generated images
  const images = readdirSync(tempDir)
    .filter((f) => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'))
    .sort()
    .slice(0, 10); // Max 10 pages for OCR

  if (images.length === 0) return '';

  // OCR each image
  const texts: string[] = [];
  for (const img of images) {
    const imgPath = join(tempDir, img);
    const text = await parseImage(imgPath);
    if (text && !text.startsWith('(')) {
      texts.push(text);
    }
  }

  return texts.join('\n\n--- Page break ---\n\n');
}
