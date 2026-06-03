import { db } from './db';
import { InventoryLot, InventoryMovement } from '../models';

/** Thin repository for inventory‑related data */
export const inventoryRepo = {
  async getAllLots(): Promise<InventoryLot[]> {
    return db.lots.toArray();
  },

  async getLotById(id: string): Promise<InventoryLot | undefined> {
    return db.lots.get(id);
  },

  async addLot(lot: InventoryLot): Promise<string> {
    return db.lots.add(lot);
  },

  async addMovement(movement: InventoryMovement): Promise<string> {
    return db.movements.add(movement);
  },
};
