import { db } from './db';
import { Recipe, RecipeIngredient, ProductionBatch } from '../domain/recipeTypes';
import { InventoryLot, InventoryMovement, MovementType } from '../domain/inventoryTypes';
import { genId } from './inventoryRepository'; // reuse ID generator

/** Helper to fetch a recipe with its ingredients */
export async function getRecipeWithIngredients(recipeId: string): Promise<{ recipe: Recipe; ingredients: RecipeIngredient[] }> {
  const recipe = await db.recipes.get(recipeId);
  if (!recipe) throw new Error('Recipe not found');
  const ingredients = await db.recipeIngredients.where('recipeId').equals(recipeId).toArray();
  return { recipe, ingredients };
}

/** List all recipes */
export async function listRecipes(): Promise<Recipe[]> {
  return db.recipes.toArray();
}

/** Create a new recipe (ingredients optional) */
export async function createRecipe(data: {
  name: string;
  description?: string;
  expectedYield: number;
  yieldUnit: string;
  ingredients: { inventoryItemId: string; quantity: number; unit: string }[];
}): Promise<Recipe> {
  const now = new Date().toISOString();
  const recipe: Recipe = {
    id: genId(),
    name: data.name,
    description: data.description,
    expectedYield: data.expectedYield,
    yieldUnit: data.yieldUnit,
    createdAt: now,
    updatedAt: now,
  };
  await db.recipes.add(recipe);
  // add ingredients
  const ingEntities: RecipeIngredient[] = data.ingredients.map((ing) => ({
    id: genId(),
    recipeId: recipe.id,
    inventoryItemId: ing.inventoryItemId,
    quantity: ing.quantity,
    unit: ing.unit,
  }));
  await db.recipeIngredients.bulkAdd(ingEntities);
  return recipe;
}

/** Update a recipe (does not touch ingredients) */
export async function updateRecipe(recipeId: string, changes: Partial<Omit<Recipe, 'id' | 'createdAt'>>): Promise<void> {
  const now = new Date().toISOString();
  await db.recipes.update(recipeId, { ...changes, updatedAt: now });
}

/** Update recipe along with its ingredient lines (replace all) */
export async function updateRecipeWithIngredients(recipeId: string, data: {
  name?: string;
  description?: string;
  expectedYield?: number;
  yieldUnit?: string;
  ingredients: { inventoryItemId: string; quantity: number; unit: string }[];
}): Promise<void> {
  const now = new Date().toISOString();
  const { ingredients, ...recipeChanges } = data;
  // Update recipe fields
  await db.recipes.update(recipeId, { ...recipeChanges, updatedAt: now });
  // Replace ingredients: delete existing then bulk add new
  await db.recipeIngredients.where('recipeId').equals(recipeId).delete();
  const ingEntities: RecipeIngredient[] = ingredients.map((ing) => ({
    id: genId(),
    recipeId,
    inventoryItemId: ing.inventoryItemId,
    quantity: ing.quantity,
    unit: ing.unit,
  }));
  if (ingEntities.length) {
    await db.recipeIngredients.bulkAdd(ingEntities);
  }
}


/** Delete recipe and its ingredients */
export async function deleteRecipe(recipeId: string): Promise<void> {
  await db.recipeIngredients.where('recipeId').equals(recipeId).delete();
  await db.recipes.delete(recipeId);
}

/** Compute availability of each ingredient against current inventory */
export async function computeRecipeAvailability(recipeId: string): Promise<
  Array<{
    ingredient: RecipeIngredient;
    totalAvailable: number;
    sufficient: boolean;
  }>
> {
  const { ingredients } = await getRecipeWithIngredients(recipeId);
  const results = [] as any[];
  for (const ing of ingredients) {
    const lots = await db.inventoryLots.where('itemId').equals(ing.inventoryItemId).toArray();
    const total = lots.reduce((sum, l) => sum + l.quantity, 0);
    results.push({ ingredient: ing, totalAvailable: total, sufficient: total >= ing.quantity });
  }
  return results;
}

/** Prepare (produce) a given recipe for a number of batches.
 * Consumes inventory lots using FEFO (earliest expiry first) and records movements.
 */
export async function prepareRecipe(params: {
  recipeId: string;
  batches: number; // number of batches to produce
  notes?: string;
}): Promise<ProductionBatch> {
  const { recipeId, batches, notes } = params;
  const { recipe, ingredients } = await getRecipeWithIngredients(recipeId);

  // For each ingredient, compute required total quantity
  for (const ing of ingredients) {
    const required = ing.quantity * batches;
    // Fetch lots for the item, sorted by expiry (earliest first, null last)
    const lots = await db.inventoryLots.where('itemId').equals(ing.inventoryItemId).toArray();
    lots.sort((a, b) => {
      if (!a.expiryDate) return 1;
      if (!b.expiryDate) return -1;
      return a.expiryDate.localeCompare(b.expiryDate);
    });
    let remaining = required;
    for (const lot of lots) {
      if (remaining <= 0) break;
      const consume = Math.min(lot.quantity, remaining);
      const newQty = lot.quantity - consume;
      const now = new Date().toISOString();
      // Update lot quantity or delete if zero
      if (newQty > 0) {
        await db.inventoryLots.update(lot.id, { quantity: newQty, updatedAt: now });
      } else {
        await db.inventoryLots.delete(lot.id);
      }
      // Record movement
      const movement: InventoryMovement = {
        id: genId(),
        itemId: ing.inventoryItemId,
        lotId: lot.id,
        type: 'production', // extended type, works with our enum as string
        quantityDelta: -consume,
        unit: ing.unit as any,
        createdAt: now,
      };
      await db.inventoryMovements.add(movement);
      remaining -= consume;
    }
    if (remaining > 0) {
      // Not enough inventory – roll back would be complex; for now throw.
      throw new Error(`Inventario insufficiente per ingrediente ${ing.inventoryItemId}`);
    }
  }

  // All consumptions succeeded – create production batch record
  const producedQty = batches * recipe.expectedYield;
  const batch: ProductionBatch = {
    id: genId(),
    recipeId,
    producedQuantity: producedQty,
    producedUnit: recipe.yieldUnit,
    notes,
    createdAt: new Date().toISOString(),
  };
  await db.productionBatches.add(batch);
  return batch;
}
