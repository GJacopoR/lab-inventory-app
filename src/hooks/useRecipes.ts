import { useEffect, useState, useCallback } from 'react';
import { listRecipes, getRecipeWithIngredients, computeRecipeAvailability, prepareRecipe, createRecipePreparation, listPreparations, getPreparation } from '../repositories/recipeRepository';
import { Recipe, RecipeIngredient, RecipePreparation, LabelDateType, ShelfLifePreset, StorageCondition } from '../domain/recipeTypes';
import { AggregatedItem, listAggregatedItems } from '../repositories/inventoryRepository';
import { db } from '../repositories/db';

/** Hook for recipe list and detail handling */
export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<{
    recipe: Recipe;
    ingredients: (RecipeIngredient & { itemName?: string })[];
    availability: any[];
  } | null>(null);

  const loadRecipes = useCallback(async () => {
    setLoading(true);
    const data = await listRecipes();
    setRecipes(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  const loadDetail = async (id: string) => {
    const { recipe, ingredients } = await getRecipeWithIngredients(id);
    const availability = await computeRecipeAvailability(id);
    // Resolve item names for ingredients
    const itemIds = ingredients.map(i => i.inventoryItemId);
    const items = await db.inventoryItems.where('id').anyOf(itemIds).toArray();
    const itemMap = new Map(items.map(item => [item.id, item.name]));
    const ingredientsWithNames = ingredients.map(i => ({
      ...i,
      itemName: itemMap.get(i.inventoryItemId) || i.inventoryItemId,
    }));
    setDetail({ recipe, ingredients: ingredientsWithNames, availability });
  };

  const prepare = async (recipeId: string, batches: number) => {
    await prepareRecipe({ recipeId, batches });
    // reload detail to reflect new inventory state
    await loadDetail(recipeId);
  };

  return { recipes, loading, loadDetail, detail, prepare, refresh: loadRecipes };
}

/** Hook for preparation management */
export function usePreparations() {
  const [preparations, setPreparations] = useState<RecipePreparation[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPreparations = useCallback(async (recipeId?: string) => {
    setLoading(true);
    const data = await listPreparations(recipeId);
    setPreparations(data);
    setLoading(false);
  }, []);

  const createPreparation = async (params: {
    recipeId: string;
    producedQuantity: number;
    producedUnit: string;
    netQuantityLabel?: string;
    shelfLifePreset: ShelfLifePreset;
    dateType: LabelDateType;
    storageCondition: StorageCondition;
    operatorName?: string;
    plantCode?: string;
  }) => {
    const preparation = await createRecipePreparation(params);
    setPreparations(prev => [preparation, ...prev]);
    return preparation;
  };

  const loadPreparation = async (id: string) => {
    return getPreparation(id);
  };

  return { preparations, loading, loadPreparations, createPreparation, loadPreparation, refresh: loadPreparations };
}
