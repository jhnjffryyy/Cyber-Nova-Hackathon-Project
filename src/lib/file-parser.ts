import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { createWorker } from 'tesseract.js';

// Configure local Vite-bundled worker for pdfjs-dist
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export interface ExtractedFileContent {
  fileName: string;
  fileSize: number;
  fileType: string;
  text: string;
  wordCount: number;
  preview: string;
  isScannedImage?: boolean;
}

export type ScanProgressCallback = (percent: number, status: string) => void;

/**
 * High-performance client-side extractor & OCR scanner for PDF, PNG, JPG, TXT, MD, CSV.
 * Uses pdfjs-dist with canvas OCR fallback for scanned PDFs, and local Tesseract.js OCR for images.
 */
export async function extractTextFromFile(
  file: File,
  onProgress?: ScanProgressCallback
): Promise<ExtractedFileContent> {
  const fileType = file.type || '';
  const fileName = file.name || 'uploaded-file';
  let text = '';
  let isScannedImage = false;

  try {
    if (fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
      if (onProgress) onProgress(10, 'Initializing PDF parser...');
      text = await extractTextFromPDF(file, onProgress);
    } else if (
      fileType.startsWith('image/') ||
      /\.(png|jpe?g|webp|bmp|gif|tiff)$/i.test(fileName)
    ) {
      isScannedImage = true;
      if (onProgress) onProgress(15, 'Initializing local OCR scanner for image...');
      text = await extractTextFromImageOCR(file, onProgress);
    } else if (
      fileType.startsWith('text/') ||
      fileName.endsWith('.txt') ||
      fileName.endsWith('.md') ||
      fileName.endsWith('.json') ||
      fileName.endsWith('.csv')
    ) {
      if (onProgress) onProgress(50, 'Reading text file...');
      text = await file.text();
    } else {
      // Default: try text reader
      text = await file.text();
    }
  } catch (err) {
    console.warn('Primary file extraction error, attempting raw reader:', err);
    try {
      text = await file.text();
    } catch {
      text = '';
    }
  }

  // Clean and sanitize extracted text
  const cleanText = text.replace(/\r\n/g, '\n').trim();
  const words = cleanText ? cleanText.split(/\s+/).filter(Boolean) : [];

  if (onProgress) onProgress(100, 'Scan complete!');

  return {
    fileName,
    fileSize: file.size,
    fileType: fileType || 'document',
    text: cleanText,
    wordCount: words.length,
    preview: cleanText.slice(0, 300) + (cleanText.length > 300 ? '...' : ''),
    isScannedImage,
  };
}

/**
 * Client-side OCR for PNG/JPG images or canvas blobs using Tesseract.js
 */
export async function extractTextFromImageOCR(
  imageSource: File | Blob | HTMLCanvasElement,
  onProgress?: ScanProgressCallback
): Promise<string> {
  try {
    if (onProgress) onProgress(25, 'Loading local Tesseract OCR engine...');
    const worker = await createWorker('eng');

    if (onProgress) onProgress(50, 'Recognizing characters from image...');
    const ret = await worker.recognize(imageSource);
    await worker.terminate();

    const ocrText = ret.data.text.trim();
    if (ocrText.length > 0) {
      return ocrText;
    }
  } catch (ocrErr) {
    console.warn('Tesseract OCR error:', ocrErr);
  }

  return '';
}

/**
 * Robust client-side PDF text extractor.
 * 1. Tries direct text content extraction from digital PDF streams.
 * 2. If the PDF is scanned (contains images instead of text), renders pages to canvas and runs Tesseract OCR!
 */
async function extractTextFromPDF(
  file: File,
  onProgress?: ScanProgressCallback
): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      isEvalSupported: false,
    } as any);

    const pdf = await loadingTask.promise;
    const pageTexts: string[] = [];
    const totalPages = Math.min(pdf.numPages, 30);
    let totalTextChars = 0;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      if (onProgress) {
        const pct = Math.round(15 + (pageNum / totalPages) * 50);
        onProgress(pct, `Reading PDF page ${pageNum} of ${totalPages}...`);
      }
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageString = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');

      totalTextChars += pageString.trim().length;
      pageTexts.push(pageString.trim());
    }

    const digitalText = pageTexts.join('\n\n').trim();

    // If digital text was found with meaningful content, return it!
    if (digitalText.length > 30 && totalTextChars > 25) {
      return digitalText;
    }

    // SCANNED PDF FALLBACK:
    // If the PDF has very little digital text (e.g. Cariño_COR.pdf is a scanned image or photo saved as PDF)
    // Render pages to canvas and run Tesseract OCR on each page!
    if (onProgress) {
      onProgress(65, 'Scanned image detected in PDF. Running OCR on pages...');
    }

    const ocrPageTexts: string[] = [];
    const ocrPagesCount = Math.min(pdf.numPages, 5); // Scan up to 5 pages

    for (let p = 1; p <= ocrPagesCount; p++) {
      if (onProgress) {
        onProgress(
          Math.round(65 + (p / ocrPagesCount) * 30),
          `OCR scanning PDF page ${p} of ${ocrPagesCount}...`
        );
      }
      const page = await pdf.getPage(p);
      const viewport = page.getViewport({ scale: 1.8 });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        await page.render({ canvasContext: ctx, viewport } as any).promise;
        const pageOcr = await extractTextFromImageOCR(canvas, onProgress);
        if (pageOcr.trim()) {
          ocrPageTexts.push(pageOcr.trim());
        }
      }
    }

    const combinedOcr = ocrPageTexts.join('\n\n').trim();
    if (combinedOcr.length > 10) {
      return combinedOcr;
    }
  } catch (pdfErr) {
    console.warn('PDF.js execution error, checking canvas OCR fallback:', pdfErr);
  }

  // Raw stream scan fallback if pdfjs fails completely
  try {
    const rawBuffer = await file.arrayBuffer();
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const rawString = decoder.decode(rawBuffer);

    // Look for readable plain text tokens
    const textChunks: string[] = [];
    const tjRegex = /\(([^)]{3,})\)\s*Tj/g;
    let match;
    while ((match = tjRegex.exec(rawString)) !== null) {
      if (match[1] && match[1].length > 2) {
        textChunks.push(match[1]);
      }
    }
    if (textChunks.length > 5) {
      return textChunks.join(' ');
    }
  } catch {}

  return '';
}
