import { readFileSync } from 'node:fs';

export async function parseEmail(filePath: string): Promise<{ text: string; metadata: Record<string, unknown> }> {
  const { simpleParser } = await import('mailparser');
  const content = readFileSync(filePath);
  const parsed = await simpleParser(content);

  const parts: string[] = [];

  if (parsed.from?.text) parts.push(`Von: ${parsed.from.text}`);
  if (parsed.to) {
    const to = Array.isArray(parsed.to) ? parsed.to.map((t) => t.text).join(', ') : parsed.to.text;
    parts.push(`An: ${to}`);
  }
  if (parsed.subject) parts.push(`Betreff: ${parsed.subject}`);
  if (parsed.date) parts.push(`Datum: ${parsed.date.toISOString()}`);
  parts.push('---');

  if (parsed.text) {
    parts.push(parsed.text);
  } else if (parsed.html) {
    // Fallback: strip HTML tags
    parts.push(parsed.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
  }

  if (parsed.attachments?.length) {
    parts.push(`\n--- Anhaenge (${parsed.attachments.length}) ---`);
    for (const att of parsed.attachments) {
      parts.push(`- ${att.filename || 'unbekannt'} (${att.contentType}, ${att.size} Bytes)`);
    }
  }

  return {
    text: parts.join('\n'),
    metadata: {
      from: parsed.from?.text,
      to: Array.isArray(parsed.to) ? parsed.to.map((t) => t.text) : parsed.to?.text,
      subject: parsed.subject,
      date: parsed.date?.toISOString(),
      attachmentCount: parsed.attachments?.length || 0,
    },
  };
}
