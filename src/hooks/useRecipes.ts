import { useEffect, useState, useCallback } from 'react';
import { listRecipes, getRecipeWithIngredients, computeRecipeAvailability, prepareRecipe } from '../repositories/recipeRepository';
import { Recipe, RecipeIngredient } from '../domain/recipeTypes';
import { AggregatedItem, listAggregatedItems } from '../repositories/inventoryRepository';

/** Hook for recipe list and detail handling */
export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<{ recipe: Recipe; ingredients: RecipeIngredient[]; availability: any[] } | null>(
    null
  );

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
    setDetail({ recipe, ingredients, availability });
  };

  const prepare = async (recipeId: string, batches: number) => {
    await prepareRecipe({ recipeId, batches });
    // reload detail to reflect new inventory state
    await loadDetail(recipeId);
  };

  return { recipes, loading, loadDetail, detail, prepare, refresh: loadRecipes };
}
