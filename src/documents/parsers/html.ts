import { readFileSync } from 'node:fs';

export async function parseHtml(filePath: string): Promise<string> {
  const cheerio = await import('cheerio');
  const content = readFileSync(filePath, 'utf-8');
  const $ = cheerio.load(content);

  // Remove script and style elements
  $('script, style, nav, footer, header').remove();

  // Get text content
  const text = $('body').text() || $.text();

  // Clean up whitespace
  return text.replace(/\s+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}
