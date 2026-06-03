import { db } from './db';
import { Product } from '../models';

/** Thin repository for Product entity */
export const productRepo = {
  async getAll(): Promise<Product[]> {
    return db.products.toArray();
  },

  async getById(id: string): Promise<Product | undefined> {
    return db.products.get(id);
  },

  async add(product: Product): Promise<string> {
    return db.products.add(product);
  },

  async update(id: string, changes: Partial<Product>): Promise<number> {
    return db.products.update(id, changes);
  },

  async delete(id: string): Promise<void> {
    await db.products.delete(id);
  },
};
