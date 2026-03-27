import { readFileSync } from 'node:fs';

export async function parseXlsx(filePath: string): Promise<{ text: string; sheets: string[] }> {
  const XLSX = await import('xlsx');
  const buffer = readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  const sheets: string[] = [];
  const textParts: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    sheets.push(sheetName);
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const csv = XLSX.utils.sheet_to_csv(sheet);
    textParts.push(`--- Sheet: ${sheetName} ---\n${csv}`);
  }

  return {
    text: textParts.join('\n\n'),
    sheets,
  };
}

export async function parseCsv(filePath: string): Promise<string> {
  const content = readFileSync(filePath, 'utf-8');
  return content;
}
