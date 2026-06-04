/**
 * Domain types for the inventory subsystem.
 * These are purpose‑built for the local IndexedDB persistence layer.
 */

/** Unit of measure – keep it simple; can be extended later. */
export type UnitOfMeasure = 'kg' | 'g' | 'l' | 'ml' | 'pz' | 'unit';

/** Standardized allergen vocabulary for EU food labeling */
export type AllergenTag =
  | 'cereals_containing_gluten'
  | 'crustaceans'
  | 'eggs'
  | 'fish'
  | 'peanuts'
  | 'soybeans'
  | 'milk'
  | 'nuts'
  | 'celery'
  | 'mustard'
  | 'sesame'
  | 'sulphites'
  | 'lupin'
  | 'molluscs';

/** Label-related metadata for inventory items */
export interface ItemLabelMetadata {
  labelName?: string;
  allergenTags: AllergenTag[];
  mayContain?: AllergenTag[];
}

/** Types of inventory movements. */
export type MovementType =
  | 'create_lot'
  | 'update_lot'
  | 'delete_lot'
  | 'manual_adjustment'
  | 'production';

/** Inventory item – a product that can have many lots. */
export interface InventoryItem {
  id: string;
  name: string;
  /** Optional SKU / internal code */
  sku?: string;
  defaultUnit: UnitOfMeasure;
  notes?: string;
  /** Label metadata for food labeling */
  labelMetadata?: ItemLabelMetadata;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/** A specific batch/lot of an inventory item. */
export interface InventoryLot {
  id: string;
  itemId: string;
  lotNumber?: string;
  quantity: number;
  unit: UnitOfMeasure;
  /** Nullable – some items may not have an expiry date */
  expiryDate?: string | null;
  supplier?: string;
  purchaseDocumentRef?: string;
  createdAt: string;
  updatedAt: string;
}

/** A movement record for audit/history. */
export interface InventoryMovement {
  id: string;
  itemId: string;
  lotId?: string | null;
  type: MovementType;
  quantityDelta: number;
  unit: UnitOfMeasure;
  reason?: string;
  createdAt: string;
}
