import { createWorker } from 'tesseract.js';

/**
 * Run OCR on an image or PDF (first page) and return plain text.
 * Uses Italian + English for better Italian invoice recognition.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  const worker = await createWorker({ logger: () => {} });
  try {
    await worker.load();
    await worker.loadLanguage('ita+eng');
    await worker.initialize('ita+eng');
    const { data } = await worker.recognize(url);
    return data.text;
  } finally {
    await worker.terminate();
    URL.revokeObjectURL(url);
  }
}

function genItemId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function normalizeDate(dateStr: string): string | null {
  if (!dateStr) return null;
  const match = dateStr.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if (!match) return null;
  const [, d, m, y] = match;
  const nd = parseInt(d, 10);
  const nm = parseInt(m, 10);
  if (nd < 1 || nd > 31 || nm < 1 || nm > 12) return null;
  const year = y.length === 2 ? `20${y}` : y;
  const ny = parseInt(year, 10);
  if (ny < 2000 || ny > 2099) return null;
  return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function normalizeUnit(unit: string | undefined): string {
  if (!unit) return 'pz';
  const normalized = unit.toLowerCase().trim();
  if (/^kg$|^kgs?$/.test(normalized)) return 'kg';
  if (/^g$|grammi?/.test(normalized)) return 'g';
  if (/^l$|^lt?$|litri?/.test(normalized)) return 'l';
  if (/^ml$/.test(normalized)) return 'ml';
  if (/^pz$|^pcs$|^pezzi?$/.test(normalized)) return 'pz';
  if (/^confezioni?$/.test(normalized)) return 'pz';
  return normalized;
}

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

function validateItem(item: ParsedItem): ParsedItem {
  const reasons: string[] = [];
  if (item.quantity === undefined || item.quantity === null) {
    reasons.push('Quantità mancante');
  } else if (item.quantity <= 0) {
    reasons.push('Quantità non valida');
  } else if (item.quantity > 10000) {
    reasons.push('Quantità sospetta (troppo alta)');
  }
  if (!item.productName || item.productName.length < 3) {
    reasons.push('Nome prodotto troppo corto');
  }
  if (item.unit && !['kg', 'g', 'l', 'ml', 'pz'].includes(item.unit)) {
    reasons.push('Unità non standard');
  }
  if (item.expiryDate && !normalizeDate(item.expiryDate)) {
    reasons.push('Data di scadenza non valida');
  }
  const needsReview = reasons.length > 0 || item.confidence === 'low';
  return {
    ...item,
    needsReview,
    reviewReasons: reasons.length > 0 ? reasons : undefined,
    confidence: reasons.length > 2 ? 'low' : reasons.length > 0 ? 'medium' : item.confidence,
  };
}

// ─── Layout detection ──────────────────────────────────────────────

interface LayoutInfo {
  type: 'tabular' | 'freeform' | 'unknown';
  confidence: 'high' | 'medium' | 'low';
  supplierId?: string;
  columnHeaderIndex?: number;
  columnHeaderText?: string;
}

const COLUMN_KEYWORDS = [
  'quantità', 'quantita', 'u\\.m', 'prezzo', 'importo',
  'descrizione', 'articolo', 'lotto', 'scadenza',
  'c\\.iva', 'iva', 'colli', 'totale',
  'prodotto', 'codice', 'cod\\.',
  'nome scientifico', 'fornitore',
];

function hasColumnKeywords(line: string): number {
  const lower = line.toLowerCase();
  let count = 0;
  for (const kw of COLUMN_KEYWORDS) {
    if (new RegExp(kw, 'i').test(lower)) count++;
  }
  return count;
}

const KNOWN_SUPPLIERS: Record<string, string[]> = {
  eurofish: ['eurofish napoli', 'eurofish s.r.l', 'eurofish srl'],
  rossi: ['distribuzione rossi', 'rossi srl', 'rossi spa'],
  mangim: ['mangim', 'mangimamento', 'alimentar'],
};

function detectSupplier(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const [id, patterns] of Object.entries(KNOWN_SUPPLIERS)) {
    for (const p of patterns) {
      if (lower.includes(p)) return id;
    }
  }
  return undefined;
}

function detectLayout(text: string): LayoutInfo {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const supplierId = detectSupplier(text);

  let bestKwCount = 0;
  let bestKwLine = -1;
  let bestKwText = '';

  for (let i = 0; i < lines.length; i++) {
    const count = hasColumnKeywords(lines[i]);
    if (count > bestKwCount) {
      bestKwCount = count;
      bestKwLine = i;
      bestKwText = lines[i];
    }
  }

  if (bestKwCount >= 3) {
    return {
      type: 'tabular',
      confidence: 'high',
      supplierId,
      columnHeaderIndex: bestKwLine,
      columnHeaderText: bestKwText,
    };
  }

  if (bestKwCount >= 1) {
    return {
      type: 'tabular',
      confidence: 'medium',
      supplierId,
      columnHeaderIndex: bestKwLine,
      columnHeaderText: bestKwText,
    };
  }

  if (supplierId) {
    return { type: 'freeform', confidence: 'high', supplierId };
  }

  return { type: 'unknown', confidence: 'low' };
}

// ─── Header extraction ─────────────────────────────────────────────

function extractHeader(lines: string[], layout: LayoutInfo): any {
  const header: any = {};

  const dataStartIndex = layout.type === 'tabular' && layout.columnHeaderIndex != null
    ? layout.columnHeaderIndex
    : Math.floor(lines.length * 0.3);

  const headerLines = lines.slice(0, dataStartIndex);
  const allLines = textToLines(lines.join('\n'));

  for (const line of allLines) {
    const lower = line.toLowerCase();
    const trimmed = line.trim();

    const isAddress = /^(?:via|viale|corso|piazza|loc|località|s\.?s\.?|strada|contrada|frazione|borgata|paese)/i.test(trimmed);
    if (isAddress && !lower.includes('documento')) continue;

    const docNumberCandidate = (): string | null => {
      let m = trimmed.match(/\b(\d{3,5}\s*[\/\\|]\s*[A-Z0-9]{2,10})\b/);
      if (m) return m[1].trim().replace(/\s*\|\s*/g, '/');
      m = trimmed.match(/(?:ddt|fattura|invoice)\s*n[:\s]*([A-Z0-9\/\-]{4,})/i);
      if (m) return m[1].trim();
      m = trimmed.match(/(?:documento|num|doc\.)\s*[:\s]*((?=[A-Z0-9\/\-_.]*\d)[A-Z0-9][A-Z0-9\/\-_.]{2,})/i);
      if (m) return m[1].trim();
      return null;
    };
    const candidate = docNumberCandidate();
    if (candidate && !/^\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}$/.test(candidate)) {
      if (!header.documentNumber || candidate.length > header.documentNumber.length) {
        header.documentNumber = candidate;
      }
    }
    if (!header.documentDate) {
      const dateMatch = trimmed.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
      if (dateMatch) {
        const parsed = normalizeDate(dateMatch[0]);
        if (parsed) header.documentDate = parsed;
      }
    }
    if (!header.supplierName) {
      if (lower.includes('fornitore') || lower.includes('supplier')) {
        const sm = trimmed.match(/(?:fornitore|supplier)[:\s]+(.+)/i);
        if (sm && sm[1].length > 2) header.supplierName = sm[1].trim();
      }
    }
  }

  return header;
}

function textToLines(text: string): string[] {
  return text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
}

// ─── Unit pattern helpers ──────────────────────────────────────────

const UNIT_PATTERN = /(kg|kgs?|g|grammi?|l|lt?|litri?|ml|pz|pcs|pezzi?|confezioni?)/i;

function findQtyWithUnit(line: string): { match: string; qtyStr: string; unit: string; index: number } | null {
  const regex = /(\d+(?:[.,]\d+)?)\s*(kg|kgs?|g|grammi?|l|lt?|litri?|ml|pz|pcs|pezzi?|confezioni?)(?:[x×+])?(?:\b|(?=[\s,;/\-]|$))/i;
  let best: { match: string; qtyStr: string; unit: string; index: number } | null = null;
  let m: RegExpExecArray | null;
  const re = new RegExp(regex.source, 'gi');
  while ((m = re.exec(line)) !== null) {
    const qty = parseFloat(m[1].replace(',', '.'));
    if (qty > 0 && qty <= 100000) {
      if (!best || m.index > best.index) {
        const matchLen = m[0].length;
        best = { match: m[0], qtyStr: m[1], unit: m[2], index: m.index };
      }
    }
  }
  return best;
}

// ─── Lot code detection (without "lotto:" prefix) ──────────────────

function findLotCode(line: string): string | undefined {
  const explicitMatch = line.match(/\b(?:lotto|lot|batch|n\.?\s*lotto)[:\-]?\s*([A-Z0-9][A-Z0-9\-_.\/]{2,})/i);
  if (explicitMatch) return explicitMatch[1];

  const candidates: string[] = [];
  const codeRegex = /(?<!\d)([A-Z0-9]{2,}[-\/][A-Z0-9]{2,})(?!\d)/g;
  let m: RegExpExecArray | null;
  while ((m = codeRegex.exec(line)) !== null) {
    const code = m[0];
    if (code.length >= 4 && !/^\d+$/.test(code) && !line.includes('www.') && !line.includes('@')) {
      candidates.push(code);
    }
  }

  if (candidates.length > 0) {
    const sorted = candidates.sort((a, b) => b.length - a.length);
    return sorted[0];
  }

  const genericCode = line.match(/\b([A-Z0-9]{5,15})\b/);
  if (genericCode && !/^\d+$/.test(genericCode[1])) {
    const val = genericCode[1];
    if (!line.toLowerCase().includes('partita iva') && !line.toLowerCase().includes('p.iva') && !line.toLowerCase().includes('cod.fiscale')) {
      return val;
    }
  }

  return undefined;
}

// ─── Price / numeric field removal ─────────────────────────────────

function removeTrailingPriceFields(text: string): string {
  return text
    .replace(/\s+\d{1,3}(?:[.,]\d{2,3})\s*\d{0,3}$/, '')
    .replace(/\s+\d{1,3}(?:[.,]\d{2,3})\s*\d{1,2}$/, '')
    .replace(/\s+\d{1,3}(?:[.,]\d{2,3})$/, '')
    .trim();
}

function isGarbageLine(line: string): boolean {
  const cleaned = line.replace(/[^a-zA-ZÀ-ÿ0-9\s\-.,\/@]/g, '').trim();
  if (cleaned.length < 6) return true;
  if (!/[a-zA-ZÀ-ÿ]{3,}/.test(line)) return true;
  const noSpace = line.replace(/\s/g, '');
  const nonAlphaNum = noSpace.replace(/[a-zA-ZÀ-ÿ0-9]/g, '').length;
  if (nonAlphaNum / Math.max(1, noSpace.length) > 0.6) return true;
  return false;
}

function isHeaderOrFooterLine(line: string): boolean {
  const lower = line.toLowerCase();
  const skip = [
    /^(?:pagina|page)\s*\d/i,
    /^(?:totale|total|imponibile|iva|tot\b)/i,
    /^(?:cod\.?\s*(?:iva|fiscale)|partita\s*iva|p\s*iva|rea|capi|capitale|cciAA)/i,
    /^(?:e-?mail|www\.|pec|tel|fax|telefono)/i,
    /^(?:spedizione|mittente|destinatario|vettore|luogo\s*di|temperatura)/i,
    /^(?:convenzione|banca|iban|abì|cab|cuc|cig)/i,
    /^(?:firma|ricevuta|consegna)/i,
    /^\s*[|\\\/\-\_=]+\s*$/,
    /^[\s|]*$/,
  ];
  return skip.some(p => p.test(lower));
}

// ─── Tabular DDT parser ────────────────────────────────────────────

function parseTabular(text: string, layout: LayoutInfo): { header: any; items: ParsedItem[] } {
  const lines = textToLines(text);
  const items: ParsedItem[] = [];

  const header = extractHeader(lines, layout);

  const colIdx = layout.columnHeaderIndex ?? findColumnHeaderLine(lines);
  const dataLines = colIdx >= 0 ? lines.slice(colIdx + 1) : [];

  const maxDataPasses = dataLines.length;

  for (let i = 0; i < maxDataPasses; i++) {
    const rawLine = dataLines[i];
    if (!rawLine || isGarbageLine(rawLine)) continue;
    if (isHeaderOrFooterLine(rawLine)) continue;
    if (hasColumnKeywords(rawLine) >= 2) continue;

    const lower = rawLine.toLowerCase();
    if (/^(\d{1,2}[\/\-\.]){2}\d{2,4}/.test(rawLine)) continue;

    let line = rawLine.trim();

    const qtyMatch = findQtyWithUnit(line);
    if (!qtyMatch) continue;

    const quantity = parseFloat(qtyMatch.qtyStr.replace(',', '.'));
    const unit = normalizeUnit(qtyMatch.unit);

    const lotCode = findLotCode(line);

    let productName = line
      .substring(0, qtyMatch.index)
      .replace(/\b(?:lotto|lot|batch)[:\-]?\s*[A-Z0-9\-_.\/]+/gi, '')
      .replace(/\b(?:scadenza|exp|data\s*scad)[:\-]?\s*\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/gi, '')
      .replace(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/g, '')
      .replace(/(?:^\s*[\d\s\-_.]+\s+)/, '')
      .replace(/(?:°\s*p[zx]?\s*)$/i, '')
      .replace(/^[\d\s\-_.#]+/, '')
      .replace(/\s+[ÀÁÂÃÄÅ]\s*$/g, '')
      .replace(/\s+\d{1,3}\s*$/, '')
      .replace(/^[=\-.\s]+/, '')
      .trim();

    if (!productName || productName.length < 3) {
      const parts = line.split(/\s{2,}/);
      if (parts.length >= 2) {
        productName = parts.slice(0, -1).join(' ')
          .replace(/^[\d.\-_]+/, '')
          .trim();
      }
    }

    productName = productName
      .replace(/^(?:prodotto|descrizione|articolo|item|prodotto\s*[:])\s*/i, '')
      .replace(/[;ÀÁÂÃÄÅ]/g, '')
      .replace(/[\s\-_]+$/, '')
      .trim();

    if (!productName || productName.length < 3) continue;
    if (/^[\dA-Z\s\-]+$/.test(productName) && !/[a-z]/.test(productName)) continue;

    const rawItem: ParsedItem = {
      id: genItemId(),
      productName,
      quantity,
      unit,
      lotCode,
      expiryDate: undefined,
      notes: '',
      confidence: layout.confidence === 'high' ? 'medium' : 'low',
      needsReview: false,
    };

    items.push(validateItem(rawItem));
  }

  if (!header.supplierName) {
    const supplierFromText = detectSupplier(text);
    if (supplierFromText) {
      const nameMap: Record<string, string> = {
        eurofish: 'EUROFISH NAPOLI S.R.L.',
        rossi: 'Distribuzione Rossi',
        mangim: 'Mangimificio',
      };
      header.supplierName = nameMap[supplierFromText] || supplierFromText;
    }
  }

  return { header, items };
}

function findColumnHeaderLine(lines: string[]): number {
  let best = -1;
  let bestScore = 0;
  for (let i = 0; i < lines.length; i++) {
    const score = hasColumnKeywords(lines[i]);
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}

// ─── Improved generic parser ───────────────────────────────────────

function parseGeneric(text: string): { header: any; items: ParsedItem[] } {
  const lines = textToLines(text);
  const items: ParsedItem[] = [];

  const header = extractHeader(lines, { type: 'unknown', confidence: 'low' });

  let pendingItem: Partial<ParsedItem> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || isGarbageLine(line)) continue;
    if (isHeaderOrFooterLine(line)) continue;
    if (hasColumnKeywords(line) >= 2) continue;

    const lower = line.toLowerCase();

    if (/^(\d{1,2}[\/\-\.]){2}\d{2,4}/.test(line)) continue;

    const qtyMatch = findQtyWithUnit(line);
    if (!qtyMatch) {
      if (pendingItem && /^\d/.test(line) && !/^\d+\s*(kg|g|l|pz)/i.test(line)) {
        continue;
      }
      continue;
    }

    const quantity = parseFloat(qtyMatch.qtyStr.replace(',', '.'));
    const unit = normalizeUnit(qtyMatch.unit);

    const lotCode = findLotCode(line);

    const rawProductName = line.substring(0, qtyMatch.index).trim();

    let productName = rawProductName
      .replace(/\b(?:lotto|lot|batch)[:\-]?\s*[A-Z0-9\-_.\/]+/gi, '')
      .replace(/\b(?:scadenza|exp|data\s*scad)[:\-]?\s*\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/gi, '')
      .replace(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/g, '')
      .replace(/(?:^\s*[\d\s\-_.]+\s+)/, '')
      .replace(/^[\d\s\-_.#]+/, '')
      .replace(/\s+\d{1,3}\s*$/, '')
      .replace(/^[=\-.\s]+/, '')
      .trim();

    productName = productName
      .replace(/^(?:prodotto|descrizione|articolo|item)\s*[:]?\s*/i, '')
      .replace(/[;ÀÁÂÃÄÅ]/g, '')
      .replace(/[\s\-_]+$/, '')
      .trim();

    if (!productName || productName.length < 3) continue;
    if (/^[\dA-Z\s\-]+$/.test(productName) && !/[a-z]/.test(productName)) continue;

    const rawItem: ParsedItem = {
      id: genItemId(),
      productName,
      quantity,
      unit,
      lotCode,
      expiryDate: undefined,
      notes: '',
      confidence: 'low',
      needsReview: false,
    };

    items.push(validateItem(rawItem));
    pendingItem = null;
  }

  return { header, items };
}

// ─── Main parse router ─────────────────────────────────────────────

export function parseDocumentText(text: string): { header: any; items: any[] } {
  const layout = detectLayout(text);

  let result: { header: any; items: any[] };

  if (layout.type === 'tabular' && layout.confidence !== 'low') {
    result = parseTabular(text, layout);
  } else if (layout.supplierId === 'rossi') {
    result = parseGeneric(text);
  } else {
    result = parseGeneric(text);
  }

  if (!result.header.documentNumber) result.header.needsReview = true;
  if (!result.header.documentDate) result.header.needsReview = true;
  if (!result.header.supplierName) result.header.needsReview = true;

  return result;
}

// ─── Validators (public API) ───────────────────────────────────────

export function validateHeader(header: any): { isValid: boolean; missingFields: string[] } {
  const missing: string[] = [];
  if (!header.documentNumber) missing.push('documentNumber');
  if (!header.documentDate) missing.push('documentDate');
  if (!header.supplierName) missing.push('supplierName');
  return { isValid: missing.length === 0, missingFields: missing };
}

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
  return { isValid: issues.length === 0, issues };
}


