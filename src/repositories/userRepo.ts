import { db } from './db';
import { User } from '../models';

/** Thin repository for User entity */
export const userRepo = {
  /** Return the first seeded user (demo) */
  async getDemoUser(): Promise<User | undefined> {
    const all = await this.getAll();
    return all[0];
  },

  async getAll(): Promise<User[]> {
    return db.users.toArray();
  },

  async getById(id: string): Promise<User | undefined> {
    return db.users.get(id);
  },

  async getByUsername(username: string): Promise<User | undefined> {
    return db.users.where('username').equals(username).first();
  },

  async add(user: User): Promise<string> {
    return db.users.add(user);
  },

  async update(id: string, changes: Partial<User>): Promise<number> {
    return db.users.update(id, changes);
  },

  async delete(id: string): Promise<void> {
    await db.users.delete(id);
  },
};
