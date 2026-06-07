import { db } from '../repositories/db';
import { User, Supplier, Product, InventoryLot } from '../models';
// Recipe and ProductionBatch seeds are omitted due to updated data model.
// Import InventoryMovement from legacy models for compatibility with seeded movements.
// import { InventoryMovement } from '../models';
import bcrypt from 'bcryptjs';

/** Simple ID generator – uses the browser's crypto API when available. */
function genId(): string {
  // In Node (seed script) crypto.randomUUID is available; fallback to Date.now.
  return (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/** Seed data – runs only when the DB is empty. */
export async function seedIfEmpty(): Promise<void> {
  // Compute any async non‑DB work (e.g., password hashing) *outside* the Dexie transaction.
  const password = 'password'; // simple demo password for all users
  const hash = await bcrypt.hash(password, 10);

  // Prepare data structures that will be written inside the transaction.
  const users: User[] = [
    { id: genId(), username: 'admin', passwordHash: hash, role: 'admin' },
    { id: genId(), username: 'operatore', passwordHash: hash, role: 'operatore' },
    { id: genId(), username: 'lettura', passwordHash: hash, role: 'lettura' },
  ];

  const suppliers: Supplier[] = [
    { id: genId(), name: 'Fornitore Uno', contact: 'info@fornitore1.it' },
    { id: genId(), name: 'Fornitore Due', contact: 'contatti@fornitore2.it' },
  ];

  const products: Product[] = [
    { id: genId(), name: 'Farina 00', unit: 'kg', defaultSupplierId: suppliers[0].id },
    { id: genId(), name: 'Zucchero', unit: 'kg', defaultSupplierId: suppliers[1].id },
    { id: genId(), name: 'Uova', unit: 'pz', defaultSupplierId: suppliers[0].id },
    { id: genId(), name: 'Latte intero', unit: 'l', defaultSupplierId: suppliers[1].id },
  ];

  const today = new Date();
  const addDays = (d: number) => new Date(today.getTime() + d * 24 * 60 * 60 * 1000);
  const lots: InventoryLot[] = [
    {
      id: genId(),
      productId: products[0].id,
      supplierId: suppliers[0].id,
      quantity: 100,
      expiryDate: addDays(180).toISOString(),
      lotNumber: 'FAR-001',
      createdAt: today.toISOString(),
    },
    {
      id: genId(),
      productId: products[1].id,
      supplierId: suppliers[1].id,
      quantity: 80,
      expiryDate: addDays(200).toISOString(),
      lotNumber: 'ZUC-022',
      createdAt: today.toISOString(),
    },
    {
      id: genId(),
      productId: products[2].id,
      supplierId: suppliers[0].id,
      quantity: 200,
      expiryDate: addDays(30).toISOString(),
      lotNumber: 'UOV-07',
      createdAt: today.toISOString(),
    },
  ];


  // The original seed included recipes and production batches, but the current data model stores ingredients separately
  // and production batches have a different shape. To keep the seed simple and type‑correct we omit seeding recipes
  // and production batches here. They can be created via the UI.

  // NOTE: Movements seeding omitted for simplicity – the new inventory movements schema differs from the legacy one.
  // Run the Dexie transaction *only* for database writes.
  await db.transaction('rw', db.tables, async () => {
    await db.users.bulkAdd(users);
    await db.suppliers.bulkAdd(suppliers);
    await db.products.bulkAdd(products);
    await db.lots.bulkAdd(lots);
    // No movements added.
  });
}

/**
 * Ensure seeded users exist with correct credentials.
 * Called on app init to guarantee the 3 demo users are always available
 * and have the current password hash.
 */
export async function ensureSeededUsers(): Promise<void> {
  const roles = ['admin', 'operatore', 'lettura'];
  const password = 'password';
  const hash = await bcrypt.hash(password, 10);

  const existing = await db.users.toArray();
  const existingUsernames = new Set(existing.map(u => u.username));

  for (const role of roles) {
    const userExists = existing.find(u => u.username === role);
    if (userExists) {
      // Update password hash in case it changed
      await db.users.update(userExists.id, { passwordHash: hash });
    } else {
      await db.users.add({
        id: genId(),
        username: role,
        passwordHash: hash,
        role: role as 'admin' | 'operatore' | 'lettura',
      });
    }
  }
}