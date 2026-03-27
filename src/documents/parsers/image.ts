export async function parseImage(filePath: string): Promise<string> {
  try {
    const Tesseract = await import('tesseract.js');
    const { data } = await Tesseract.recognize(filePath, 'deu+eng', {
      logger: () => {}, // silent
    });
    return data.text || '(Kein Text in Bild erkannt)';
  } catch (err) {
    return `(OCR fehlgeschlagen: ${err instanceof Error ? err.message : String(err)})`;
  }
}

export const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.tiff', '.tif', '.bmp', '.gif', '.webp'];
