import Dexie, { Table } from 'dexie';
import {
  User,
  Supplier,
  Product,
  InventoryLot,
  InventoryMovement,
} from '../models';
import { Document } from '../domain/documentTypes';
import { Recipe as DomainRecipe, RecipeIngredient as DomainRecipeIngredient, ProductionBatch as DomainProductionBatch } from '../domain/recipeTypes';
import { InventoryItem, InventoryLot as DomainInventoryLot, InventoryMovement as DomainInventoryMovement, UnitOfMeasure } from '../domain/inventoryTypes';

/**
 * Dexie database definition.
 * Version 1 contains all core tables. All fields are stored as plain values
 * except the `ingredients` array in `recipes` which is persisted as a JSON string
 * because Dexie does not support nested arrays directly.
 */
export class LabInventoryDB extends Dexie {
  users!: Table<User, string>;
  suppliers!: Table<Supplier, string>;
  products!: Table<Product, string>;
  lots!: Table<InventoryLot, string>;
  movements!: Table<InventoryMovement, string>;
  // New recipe tables
  recipes!: Table<DomainRecipe, string>;
  recipeIngredients!: Table<DomainRecipeIngredient, string>;
  productionBatches!: Table<DomainProductionBatch, string>;
  // New inventory tables
  inventoryItems!: Table<InventoryItem, string>;
  inventoryLots!: Table<DomainInventoryLot, string>;
  inventoryMovements!: Table<DomainInventoryMovement, string>;
  // New documents table
  documents!: Table<Document, string>;

  constructor() {
    super('lab-inventory-db');
    this.version(1).stores({
      // version 1 – initial schema (productId not indexed in movements)

      users: 'id, username, role', // index role for permission checks
      suppliers: 'id, name',
      products: 'id, name, unit, defaultSupplierId', // index supplierId
      lots: 'id, productId, expiryDate', // index productId & expiryDate (used as expiresAt)
      movements: 'id, lotId, type, timestamp', // timestamp index for history
      // Recipe tables (combined) - defined later
      // Inventory tables
      inventoryItems: 'id, name, defaultUnit',
      inventoryLots: 'id, itemId, expiryDate',
      inventoryMovements: 'id, itemId, lotId, type, createdAt',
      // Recipe tables (combined)
      recipes: 'id, name, expectedYield, yieldUnit, createdAt, updatedAt',
      recipeIngredients: 'id, recipeId, inventoryItemId, quantity, unit',
      productionBatches: 'id, recipeId, producedQuantity, producedUnit, notes, createdAt',
      // Documents table
      documents: 'id, fileName, createdAt'
    });
  }
}

// Export a singleton instance so every part of the app shares the same DB.
export const db = new LabInventoryDB();

// ---------------------------------------------------------------------------
// Seed‑on‑first‑launch helper – called once the DB is opened.
// ---------------------------------------------------------------------------
import { seedIfEmpty } from '../seeds/seedData';
import { seedDemoInventory } from './inventoryRepository';

/**
 * Initialise the DB and run seed data if no users are present.
 * This function is intended to be awaited once at app start (e.g. in `main.tsx`).
 */
export async function initDb(): Promise<void> {
  await db.open();
  // Seed users and core data if empty.
  const userCount = await db.users.count();
  if (userCount === 0) {
    await seedIfEmpty();
  }
  // Seed inventory demo data if inventory is empty.
  await seedDemoInventory();
}
