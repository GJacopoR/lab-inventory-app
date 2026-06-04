/**
 * Domain types for the recipe subsystem.
 * Separate from the generic "models" which contain legacy tables.
 */

import { AllergenTag } from './inventoryTypes';

/** Label date type options */
export type LabelDateType = 'best_before' | 'use_by';

/** Shelf life preset options */
export type ShelfLifePreset = '3_days' | '7_days' | '2_years';

/** Storage condition options */
export type StorageCondition = 'refrigerated' | 'dry_place';

/** Snapshot of ingredient information for label printing */
export interface PreparationIngredientSnapshot {
  itemId: string;
  itemName: string;
  labelName: string;
  quantity: number;
  unit: string;
  allergenTags: AllergenTag[];
}

/** Nutrition snapshot placeholder for future extension */
export interface NutritionSnapshot {
  energyKj?: number;
  energyKcal?: number;
  fat?: number;
  saturates?: number;
  carbohydrate?: number;
  sugars?: number;
  protein?: number;
  salt?: number;
}

/** RecipePreparation – a produced batch of a recipe with label snapshot */
export interface RecipePreparation {
  id: string;
  recipeId: string;
  recipeNameSnapshot: string;
  foodNameSnapshot: string;
  producedAt: string; // ISO date string (production date)
  producedQuantity: number;
  producedUnit: string;
  netQuantityLabel?: string;
  lotCode: string;
  shelfLifePreset: ShelfLifePreset;
  dateType: LabelDateType;
  expiresAt: string; // ISO date string
  storageCondition: StorageCondition;
  operatorName: string;
  plantCode: string;
  ingredientSnapshot: PreparationIngredientSnapshot[];
  allergenSnapshot: AllergenTag[];
  nutritionSnapshot?: NutritionSnapshot;
  createdAt: string;
  updatedAt: string;
}

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
