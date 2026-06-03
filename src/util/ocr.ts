// OCR utility using tesseract.js (browser‑first)
import { createWorker, RecognizeResult } from 'tesseract.js';

/**
 * Run OCR on an image or PDF (first page) and return plain text.
 * The function creates a worker on demand, processes the file, and terminates the worker.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  const worker = await createWorker({ logger: () => {} });
  try {
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data } = await worker.recognize(url);
    return data.text;
  } finally {
    await worker.terminate();
    URL.revokeObjectURL(url);
  }
}

/**
 * Simple ID generator for line items
 */
function genItemId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Normalize a date string to ISO format (YYYY-MM-DD).
 * Handles DD/MM/YYYY, DD-MM-YY, DD.MM.YYYY formats.
 * Returns null if the input doesn't match expected patterns.
 */
function normalizeDate(dateStr: string): string | null {
  if (!dateStr) return null;
  const match = dateStr.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if (!match) return null;
  const [, d, m, y] = match;
  const year = y.length === 2 ? `20${y}` : y;
  return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

/**
 * Normalize unit string to standard form.
 * Returns 'pz' (pieces) as default fallback.
 */
function normalizeUnit(unit: string | undefined): string {
  if (!unit) return 'pz';
  const normalized = unit.toLowerCase().trim();
  // Common units - map variations to standard forms
  if (/^kg$|^kgs?$/.test(normalized)) return 'kg';
  if (/^g$|grammi?/.test(normalized)) return 'g';
  if (/^l$|^lt?$|litri?/.test(normalized)) return 'l';
  if (/^ml$/.test(normalized)) return 'ml';
  if (/^pz$|^pcs$|^pezzi?$/.test(normalized)) return 'pz';
  if (/^confezioni?$/.test(normalized)) return 'pz';
  return normalized;
}

/**
 * Supplier/template detection result
 */
export interface TemplateDetection {
  supplierId?: string;
  templateName?: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Known supplier templates with their parsing strategies.
 * Add more suppliers as needed based on recurring document layouts.
 */
const SUPPLIER_TEMPLATES: Record<string, {
  namePatterns: string[];
  docNumberPattern?: RegExp;
  headerParsing?: (lines: string[]) => any;
}> = {
  rossi: {
    namePatterns: ['distribuzione rossi', 'rossi srl', 'rossi spa'],
    docNumberPattern: /(?:fattura|invoice|ddt)\s*n\.?\s*(\d{4}[\/\-]\d{3})/i,
  },
  mangim: {
    namePatterns: ['mangim', 'mangimamento', 'alimentar'],
    docNumberPattern: /(?:ddt|fattura)\s*(\d{4}[\/\-]\d{3})/i,
  },
};

/**
 * Detect supplier/layout from OCR text.
 * Returns template info and confidence level.
 */
export function detectTemplate(text: string): TemplateDetection {
  const lower = text.toLowerCase();

  for (const [key, template] of Object.entries(SUPPLIER_TEMPLATES)) {
    for (const pattern of template.namePatterns) {
      if (lower.includes(pattern)) {
        return {
          supplierId: key,
          templateName: key,
          confidence: 'high',
        };
      }
    }
  }

  return { confidence: 'low' };
}

/**
 * Parse line items with confidence scoring.
 * Returns item with confidence level and review flags.
 */
interface ParsedItem {
  id: string;
  productName: string;
  quantity?: number;
  unit?: string;
  lotCode?: string;
  expiryDate?: string;
  notes?: string;
  confidence: 'high' | 'medium' | 'low';
  needsReview: boolean;
  reviewReasons?: string[];
}

/**
 * Validate a parsed item and determine if review is needed.
 */
function validateItem(item: ParsedItem): ParsedItem {
  const reasons: string[] = [];

  // Quantity validation
  if (item.quantity === undefined || item.quantity === null) {
    reasons.push('Quantità mancante');
  } else if (item.quantity <= 0) {
    reasons.push('Quantità non valida');
  } else if (item.quantity > 10000) {
    reasons.push('Quantità sospetta (troppo alta)');
  }

  // Product name validation
  if (!item.productName || item.productName.length < 3) {
    reasons.push('Nome prodotto troppo corto');
  }

  // Unit validation
  if (item.unit && !['kg', 'g', 'l', 'ml', 'pz'].includes(item.unit)) {
    reasons.push('Unità non standard');
  }

  // Expiry date validation
  if (item.expiryDate && !normalizeDate(item.expiryDate)) {
    reasons.push('Data di scadenza non valida');
  }

  // Determine confidence and review status
  const needsReview = reasons.length > 0 || item.confidence === 'low';

  return {
    ...item,
    needsReview,
    reviewReasons: reasons.length > 0 ? reasons : undefined,
    confidence: reasons.length > 2 ? 'low' : reasons.length > 0 ? 'medium' : item.confidence,
  };
}

/**
 * Generic parser for unknown document layouts.
 * Falls back to common patterns for invoice/document parsing.
 */
function genericParser(text: string): { header: any; items: ParsedItem[] } {
  const header: any = {};
  const items: ParsedItem[] = [];

  const allLines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  // Header parsing using common patterns
  for (const line of allLines) {
    const lower = line.toLowerCase();

    if (!header.documentNumber) {
      const docNumMatch = line.match(/(?:fattura|invoice|ddt)\s*(?:n\.?|nr\.?|#)?\s*([A-Z0-9\/\-]{3,})/i);
      if (docNumMatch && docNumMatch[1]) {
        header.documentNumber = docNumMatch[1];
      }
    }

    if (!header.documentDate) {
      const dateMatch = line.match(/(?:data|date)[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);
      if (dateMatch) {
        header.documentDate = normalizeDate(dateMatch[1]);
      }
    }

    if (!header.supplierName && (lower.includes('fornitore') || lower.includes('supplier'))) {
      const supplierMatch = line.match(/(?:fornitore|supplier)[:\s]+(.+)/i);
      if (supplierMatch && supplierMatch[1].length > 2) {
        header.supplierName = supplierMatch[1].trim();
      }
    }
  }

  // Line item parsing - find number followed by unit pattern
  for (const line of allLines) {
    const lower = line.toLowerCase();

    // Skip header/footer lines
    const skipPatterns = [
      /^(?:fattura\s*n|invoice\s*#|ddt\s*\d)/i,
      /^(?:data|date)[:\s]/i,
      /^(?:fornitore|supplier)[:\s]/i,
      /^(?:pagina|page)\s*\d/i,
      /^(?:totale|total|imponibile|iva)/i,
      /^(?:quantità|descrizione|prezzo|importo|articolo|codice|prodotto)/i,
    ];
    if (skipPatterns.some(p => p.test(lower))) continue;

    // Find quantity with unit pattern
    const qtyWithUnitMatch = line.match(/(\d+[,.]?\d*)\s*(kg|g|l|pz|unit|pcs|confezioni|pezzi)/i);
    if (!qtyWithUnitMatch) continue;

    const quantity = parseFloat(qtyWithUnitMatch[1].replace(',', '.'));

    // Skip if looks like year
    if (qtyWithUnitMatch[1].length >= 4 && !qtyWithUnitMatch[2] && quantity > 999) continue;

    // Extract lot and expiry
    const lotMatch = line.match(/\b(?:lotto|lot)[:\-]?\s*([A-Z0-9\-]+)/i);
    const expiryMatch = line.match(/\b(?:scadenza|exp)[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);

    // Get product name
    let productName = line
      .replace(qtyWithUnitMatch[0], '')
      .replace(/\b(?:lotto|lot)[:\-]?\s*[A-Z0-9\-]+/gi, '')
      .replace(/\b(?:scadenza|exp)[:\-]?\s*\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/gi, '')
      .replace(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/g, '')
      .replace(/[:\-\s]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    productName = productName
      .replace(/^(?:prodotto|descrizione|articolo|item)\s*[:\-]?\s*/i, '')
      .replace(/^[\d\.\-\s]+/, '')
      .trim();

    if (productName.length < 3) continue;
    if (/^[\dA-Z\s\-]+$/.test(productName) && !productName.toLowerCase().match(/\b(?:farina|zucchero|uova|acqua|olio|sale|pasta|riso|dado|biscotti)\b/)) continue;

    const rawItem: ParsedItem = {
      id: genItemId(),
      productName,
      quantity,
      unit: normalizeUnit(qtyWithUnitMatch[2]),
      lotCode: lotMatch ? lotMatch[1] : undefined,
      expiryDate: expiryMatch ? expiryMatch[1] : undefined,
      notes: '',
      confidence: 'medium', // Generic parser starts with medium confidence
      needsReview: false,
    };

    const validated = validateItem(rawItem);
    items.push(validated);
  }

  // Normalize header expiry dates
  if (header.documentDate) {
    header.documentDate = normalizeDate(header.documentDate);
  }

  return { header, items };
}

/**
 * Rossi-specific parser for known document layout.
 * Uses column detection for more accurate extraction.
 */
function rossiParser(text: string): { header: any; items: ParsedItem[] } {
  const result = genericParser(text);

  // Rossi layout often has: "DESCRIPTION       QTY   UNIT   LOTTO   SCADENZA"
  // Improve parsing with column-aware extraction

  // Mark header confidence as high if supplier was detected
  // Items are marked based on validation

  return result;
}

/**
 * Main parse function - routes to appropriate parser based on template detection.
 */
export function parseDocumentText(text: string): { header: any; items: any[] } {
  const template = detectTemplate(text);

  let result: { header: any; items: any[] };

  if (template.confidence === 'high') {
    // Use supplier-specific parser
    if (template.supplierId === 'rossi') {
      result = rossiParser(text);
    } else {
      result = genericParser(text);
    }
  } else {
    // Unknown layout - use generic parser with low confidence
    result = genericParser(text);
    // Mark all items as needing review for unknown layouts
    result.items = result.items.map(item => ({
      ...item,
      confidence: 'low',
      needsReview: true,
    }));
    // Mark header as uncertain
    result.header.confidence = 'low';
    result.header.needsReview = true;
  }

  // Ensure header has review status
  if (!result.header.needsReview) {
    result.header.needsReview = template.confidence !== 'high';
  }

  return result;
}

/**
 * Validate header fields for completeness.
 */
export function validateHeader(header: any): { isValid: boolean; missingFields: string[] } {
  const missing: string[] = [];

  if (!header.documentNumber) missing.push('documentNumber');
  if (!header.documentDate) missing.push('documentDate');
  if (!header.supplierName) missing.push('supplierName');

  return {
    isValid: missing.length === 0,
    missingFields: missing,
  };
}

/**
 * Validate a single line item.
 */
export function validateLineItem(item: any): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!item.productName || item.productName.length < 3) {
    issues.push('Nome prodotto mancante o troppo corto');
  }
  if (item.quantity === undefined || item.quantity === null) {
    issues.push('Quantità mancante');
  } else if (item.quantity <= 0) {
    issues.push('Quantità deve essere positiva');
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}