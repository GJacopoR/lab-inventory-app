import { db } from './db';
import { User } from '../models';
import { Supplier, Product, InventoryLot, InventoryMovement } from '../models';
import { Document } from '../domain/documentTypes';
import { Recipe, RecipeIngredient, ProductionBatch, RecipePreparation } from '../domain/recipeTypes';
import { InventoryItem, InventoryLot as DomainInventoryLot, InventoryMovement as DomainInventoryMovement } from '../domain/inventoryTypes';

/** Shape of the exported backup data */
export interface AppBackup {
  version: '1.0';
  exportedAt: string;
  users: User[];
  suppliers: Supplier[];
  products: Product[];
  inventoryItems: InventoryItem[];
  inventoryLots: DomainInventoryLot[];
  inventoryMovements: DomainInventoryMovement[];
  recipes: Recipe[];
  recipeIngredients: RecipeIngredient[];
  productionBatches: ProductionBatch[];
  recipePreparations: RecipePreparation[];
  documents: Document[];
}

/** Validate backup structure - exported for testing */
export function validateBackup(data: unknown): data is AppBackup {
  if (typeof data !== 'object' || data === null) return false;
  const b = data as Record<string, unknown>;
  if (b.version !== '1.0') return false;
  if (typeof b.exportedAt !== 'string') return false;
  // Check required arrays exist
  const arrays = ['users', 'suppliers', 'products', 'inventoryItems', 'inventoryLots',
                  'inventoryMovements', 'recipes', 'recipeIngredients',
                  'productionBatches', 'recipePreparations', 'documents'];
  return arrays.every(k => Array.isArray(b[k]));
}

/** Export all app data to a JSON-serializable structure */
export async function exportBackup(): Promise<AppBackup> {
  const backup: AppBackup = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    users: await db.users.toArray(),
    suppliers: await db.suppliers.toArray(),
    products: await db.products.toArray(),
    inventoryItems: await db.inventoryItems.toArray(),
    inventoryLots: await db.inventoryLots.toArray(),
    inventoryMovements: await db.inventoryMovements.toArray(),
    recipes: await db.recipes.toArray(),
    recipeIngredients: await db.recipeIngredients.toArray(),
    productionBatches: await db.productionBatches.toArray(),
    recipePreparations: await db.recipePreparations.toArray(),
    documents: await db.documents.toArray(),
  };
  return backup;
}

/** Import and restore backup data. Returns count of restored items. */
export async function restoreBackup(data: unknown, clearFirst: boolean = true): Promise<number> {
  if (!validateBackup(data)) {
    throw new Error('File di backup non valido o corrotto');
  }

  if (clearFirst) {
    // Clear all tables in reverse order of dependencies
    await db.transaction('rw', [
      db.recipePreparations, db.productionBatches, db.recipeIngredients, db.recipes,
      db.inventoryMovements, db.inventoryLots, db.inventoryItems,
      db.documents, db.products, db.suppliers, db.users
    ], async () => {
      await Promise.all([
        db.recipePreparations.clear(),
        db.productionBatches.clear(),
        db.recipeIngredients.clear(),
        db.recipes.clear(),
        db.inventoryMovements.clear(),
        db.inventoryLots.clear(),
        db.inventoryItems.clear(),
        db.documents.clear(),
        db.products.clear(),
        db.suppliers.clear(),
        db.users.clear(),
      ]);
    });
  }

  let total = 0;
  await db.transaction('rw', [
    db.users, db.suppliers, db.products, db.inventoryItems, db.inventoryLots,
    db.inventoryMovements, db.recipes, db.recipeIngredients, db.productionBatches,
    db.recipePreparations, db.documents
  ], async () => {
    // Count returned by bulkAdd is number of items added (length of array)
    const counts = await Promise.all([
      db.users.bulkAdd(data.users),
      db.suppliers.bulkAdd(data.suppliers),
      db.products.bulkAdd(data.products),
      db.inventoryItems.bulkAdd(data.inventoryItems),
      db.inventoryLots.bulkAdd(data.inventoryLots),
      db.inventoryMovements.bulkAdd(data.inventoryMovements),
      db.recipes.bulkAdd(data.recipes),
      db.recipeIngredients.bulkAdd(data.recipeIngredients),
      db.productionBatches.bulkAdd(data.productionBatches),
      db.recipePreparations.bulkAdd(data.recipePreparations),
      db.documents.bulkAdd(data.documents),
    ]);
    total = counts.reduce((sum, arr) => sum + arr.length, 0);
  });

  return total;
}