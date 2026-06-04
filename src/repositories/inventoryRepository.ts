import { db } from './db';
import { InventoryItem, InventoryLot, InventoryMovement, MovementType, UnitOfMeasure, AllergenTag } from '../domain/inventoryTypes';

/** Simple ID generator – uses browser crypto if available. */
export function genId(): string {
  // In node (seed script) crypto.randomUUID may be unavailable, fallback to timestamp.
  // At runtime in the browser this will always exist.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cryptoObj: any = (typeof crypto !== 'undefined' && crypto) || {};
  return typeof cryptoObj.randomUUID === 'function'
    ? cryptoObj.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/** Aggregated inventory item – used for list view */
export interface AggregatedItem {
  id: string;
  name: string;
  totalQuantity: number;
  unit: string;
  earliestExpiry?: string | null;
  lotCount: number;
}

/** List all inventory items with aggregation (totals, earliest expiry, lot count) */
export async function listAggregatedItems(): Promise<AggregatedItem[]> {
  const items = await db.inventoryItems.toArray();
  const lots = await db.inventoryLots.toArray();
  return items.map((item) => {
    const itemLots = lots.filter((l) => l.itemId === item.id);
    const totalQuantity = itemLots.reduce((sum, l) => sum + l.quantity, 0);
    const expiryDates = itemLots
      .map((l) => l.expiryDate)
      .filter((d): d is string => !!d);
    const earliestExpiry = expiryDates.length
      ? expiryDates.reduce((a, b) => (a < b ? a : b))
      : null;
    return {
      id: item.id,
      name: item.name,
      totalQuantity,
      unit: item.defaultUnit,
      earliestExpiry,
      lotCount: itemLots.length,
    };
  });
}

/** Get a single item with its lots */
export async function getItemWithLots(itemId: string): Promise<{ item: InventoryItem; lots: InventoryLot[] }> {
  const item = await db.inventoryItems.get(itemId);
  if (!item) throw new Error('Item not found');
  const lots = await db.inventoryLots.where('itemId').equals(itemId).toArray();
  return { item, lots };
}

/** Create a new inventory item */
export async function createItem(data: { name: string; sku?: string; defaultUnit: string; notes?: string; labelMetadata?: { labelName?: string; allergenTags: AllergenTag[]; mayContain?: AllergenTag[] } }): Promise<InventoryItem> {
  const now = new Date().toISOString();
  const newItem: InventoryItem = {
    id: genId(),
    name: data.name,
    sku: data.sku,
    defaultUnit: data.defaultUnit as any,
    notes: data.notes,
    labelMetadata: data.labelMetadata,
    createdAt: now,
    updatedAt: now,
  };
  await db.inventoryItems.add(newItem);
  return newItem;
}

/** Create a new lot for an item – also creates a movement of type create_lot */
export async function createLot(params: {
  itemId: string;
  lotNumber?: string;
  quantity: number;
  unit: string;
  expiryDate?: string | null;
  supplier?: string;
  purchaseDocumentRef?: string;
}): Promise<InventoryLot> {
  const now = new Date().toISOString();
  const lot: InventoryLot = {
    id: genId(),
    itemId: params.itemId,
    lotNumber: params.lotNumber,
    quantity: params.quantity,
    unit: params.unit as UnitOfMeasure,
    expiryDate: params.expiryDate ?? null,
    supplier: params.supplier,
    purchaseDocumentRef: params.purchaseDocumentRef,
    createdAt: now,
    updatedAt: now,
  };
  await db.inventoryLots.add(lot);
  const movement: InventoryMovement = {
    id: genId(),
    itemId: params.itemId,
    lotId: lot.id,
    type: 'create_lot',
    quantityDelta: params.quantity,
    unit: params.unit as UnitOfMeasure,
    createdAt: now,
  };
  await db.inventoryMovements.add(movement);
  return lot;
}

/** Update an existing lot – creates a movement of type update_lot with delta */
export async function updateLot(lotId: string, updates: {
  quantity?: number;
  unit?: string;
  expiryDate?: string | null;
  supplier?: string;
  purchaseDocumentRef?: string;
}): Promise<InventoryLot> {
  const existing = await db.inventoryLots.get(lotId);
  if (!existing) throw new Error('Lot not found');
  const now = new Date().toISOString();
  const delta = updates.quantity !== undefined ? updates.quantity - existing.quantity : 0;
  const updatedLot: InventoryLot = {
    ...existing,
    ...updates,
    unit: (updates.unit ?? existing.unit) as UnitOfMeasure,
    updatedAt: now,
  };
  await db.inventoryLots.put(updatedLot);
  if (delta !== 0) {
    const movement: InventoryMovement = {
      id: genId(),
      itemId: existing.itemId,
      lotId: lotId,
      type: 'update_lot',
      quantityDelta: delta,
      unit: (updates.unit ?? existing.unit) as UnitOfMeasure,
      createdAt: now,
    };
    await db.inventoryMovements.add(movement);
  }
  return updatedLot;
}

/** Delete a lot – creates a movement of type delete_lot with negative quantity */
export async function deleteLot(lotId: string): Promise<void> {
  const existing = await db.inventoryLots.get(lotId);
  if (!existing) throw new Error('Lot not found');
  const now = new Date().toISOString();
  await db.inventoryLots.delete(lotId);
  const movement: InventoryMovement = {
    id: genId(),
    itemId: existing.itemId,
    lotId,
    type: 'delete_lot',
    quantityDelta: -existing.quantity,
    unit: existing.unit as any,
    createdAt: now,
  };
  await db.inventoryMovements.add(movement);
}

/** List movements for a given item (optionally filter by lot) */
export async function listMovements(itemId: string, lotId?: string): Promise<InventoryMovement[]> {
  let query = db.inventoryMovements.where('itemId').equals(itemId);
  if (lotId) query = query.and((m) => m.lotId === lotId);
  return query.toArray();
}

/** Seed demo inventory data – called only if inventory tables are empty */
export async function seedDemoInventory(): Promise<void> {
  const count = await db.inventoryItems.count();
  if (count > 0) return;
  const now = new Date().toISOString();
  // Create items with allergen metadata
  const item1 = await createItem({
    name: 'Farina 00',
    sku: 'FAR-00',
    defaultUnit: 'kg',
    labelMetadata: { labelName: 'Farina di frumento', allergenTags: ['cereals_containing_gluten'], mayContain: [] },
  });
  const item2 = await createItem({
    name: 'Zucchero',
    sku: 'ZUC',
    defaultUnit: 'kg',
    labelMetadata: { labelName: 'Zucchero semolato', allergenTags: [], mayContain: [] },
  });
  const item3 = await createItem({
    name: 'Uova',
    sku: 'UOV',
    defaultUnit: 'pz',
    labelMetadata: { labelName: 'Uova', allergenTags: ['eggs'], mayContain: [] },
  });
  const item4 = await createItem({
    name: 'Latte intero',
    sku: 'LAT',
    defaultUnit: 'l',
    labelMetadata: { labelName: 'Latte intero', allergenTags: ['milk'], mayContain: [] },
  });

  const addDays = (d: number) => new Date(Date.now() + d * 24 * 60 * 60 * 1000).toISOString();
  // Use createLot to add lots (which also records movements)
  await createLot({ itemId: item1.id, quantity: 100, unit: 'kg', expiryDate: addDays(180), supplier: 'Fornitore Uno' });
  await createLot({ itemId: item2.id, quantity: 80, unit: 'kg', expiryDate: addDays(200), supplier: 'Fornitore Due' });
  await createLot({ itemId: item3.id, quantity: 200, unit: 'pz', expiryDate: addDays(30), supplier: 'Fornitore Uno' });
}
