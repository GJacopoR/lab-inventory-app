/**
 * Domain models for the Lab Inventory PWA.
 * All models are simple TypeScript interfaces that match the Dexie schema.
 * The app is Italian‑first, so sample data will be in Italian.
 */

export type Role = 'admin' | 'operatore' | 'lettura';

export interface User {
  id: string; // uuid
  username: string;
  passwordHash: string; // bcrypt hash (local‑only security)
  role: Role;
}

export interface Supplier {
  id: string;
  name: string;
  contact?: string;
}

export interface Product {
  id: string;
  name: string;
  unit: string; // e.g. "kg", "l", "pz"
  defaultSupplierId?: string;
}

export interface InventoryLot {
  id: string;
  productId: string;
  supplierId?: string;
  quantity: number;
  expiryDate: string; // ISO string
  lotNumber: string;
  createdAt: string; // ISO string
}

export type MovementType = 'in' | 'out' | 'adjust' | 'production';

export interface InventoryMovement {
  id: string;
  lotId: string;
  productId: string; // direct reference for reporting
  type: MovementType;
  quantity: number;
  timestamp: string; // ISO string
  note?: string;
  userId: string;
}

export interface RecipeIngredient {
  productId: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[]; // stored as JSON string in Dexie
  yieldQuantity: number;
  yieldUnit: string;
  allergens?: string[];
}

export interface ProductionBatch {
  id: string;
  recipeId: string;
  producedLotId: string;
  quantity: number;
  timestamp: string;
  userId: string;
}
