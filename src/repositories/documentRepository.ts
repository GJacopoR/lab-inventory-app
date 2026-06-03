import { db } from './db';
import { Document } from '../domain/documentTypes';
import { genId } from './inventoryRepository'; // reuse ID generator

/** Repository for Document entity */
export const documentRepo = {
  async add(document: Omit<Document, 'id'>): Promise<string> {
    const id = genId();
    await db.documents.add({ ...document, id });
    return id;
  },
  async getAll(): Promise<Document[]> {
    return db.documents.toArray();
  },
  async getById(id: string): Promise<Document | undefined> {
    return db.documents.get(id);
  },
  async delete(id: string): Promise<void> {
    await db.documents.delete(id);
  },
};
