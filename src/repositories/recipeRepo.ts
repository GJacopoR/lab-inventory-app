import { db } from './db';
import { Recipe as DomainRecipe } from '../domain/recipeTypes';

/** Thin repository for Recipe entity */
export const recipeRepo = {
  async getAll(): Promise<DomainRecipe[]> {
    return db.recipes.toArray();
  },

  async getById(id: string): Promise<DomainRecipe | undefined> {
    return db.recipes.get(id);
  },

  async add(recipe: DomainRecipe): Promise<string> {
    return db.recipes.add(recipe);
  },

  async update(id: string, changes: Partial<DomainRecipe>): Promise<number> {
    return db.recipes.update(id, changes);
  },

  async delete(id: string): Promise<void> {
    await db.recipes.delete(id);
  },
};
