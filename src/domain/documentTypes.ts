/**
 * Domain types for the Documents subsystem.
 * Stored in IndexedDB via Dexie.
 */

export interface Document {
  id: string;
  fileName: string;
  fileData: string; // base64 representation of original file for simple storage
  rawText: string; // OCR raw extracted text
  extractedFields: DocumentFields;
  status: 'uploaded' | 'processed' | 'saved' | 'linked' | 'error';
  createdAt: string;
}

/** Header-level fields parsed from the document */
export interface DocumentHeader {
  documentNumber?: string;
  documentDate?: string; // ISO date string if found
  supplierName?: string;
  notes?: string;
}

/** A single product line item extracted from a document */
export interface DocumentLineItem {
  id: string; // unique id for UI management (generated)
  productName: string;
  quantity?: number;
  unit?: string;
  lotCode?: string;
  expiryDate?: string; // ISO date string if found
  notes?: string;
  // Link to matched inventory item (if exactly one match found)
  matchedItemId?: string | null;
  // Flag for user review required
  needsReview?: boolean;
}

export interface DocumentFields {
  header: DocumentHeader;
  items: DocumentLineItem[];
}
