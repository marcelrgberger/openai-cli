export interface TextChunk {
  text: string;
  index: number;
  startChar: number;
  endChar: number;
}

const DEFAULT_CHUNK_SIZE = 1500; // characters (~375 tokens)
const DEFAULT_OVERLAP = 200;

export function chunkText(
  text: string,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
  overlap: number = DEFAULT_OVERLAP,
): TextChunk[] {
  if (!text || text.length === 0) return [];

  if (text.length <= chunkSize) {
    return [{ text, index: 0, startChar: 0, endChar: text.length }];
  }

  const chunks: TextChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length);

    // Try to break at paragraph boundary
    if (end < text.length) {
      const paragraphBreak = text.lastIndexOf('\n\n', end);
      if (paragraphBreak > start + chunkSize * 0.5) {
        end = paragraphBreak + 2;
      } else {
        // Try sentence boundary
        const sentenceBreak = text.lastIndexOf('. ', end);
        if (sentenceBreak > start + chunkSize * 0.5) {
          end = sentenceBreak + 2;
        }
      }
    }

    chunks.push({
      text: text.slice(start, end).trim(),
      index,
      startChar: start,
      endChar: end,
    });

    start = end - overlap;
    if (start >= text.length) break;
    index++;
  }

  return chunks;
}
