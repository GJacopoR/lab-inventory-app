/**
 * Domain types for the recipe subsystem.
 * Separate from the generic "models" which contain legacy tables.
 */

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  expectedYield: number; // quantity produced per batch
  yieldUnit: string; // unit of produced quantity
  createdAt: string;
  updatedAt: string;
}

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  inventoryItemId: string; // references InventoryItem
  quantity: number; // amount required per batch
  unit: string;
}

export interface ProductionBatch {
  id: string;
  recipeId: string;
  producedQuantity: number;
  producedUnit: string;
  notes?: string;
  createdAt: string;
}
