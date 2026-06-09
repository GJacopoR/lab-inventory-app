import React, { useState } from 'react';
import { InventoryTable } from '../components/ui/InventoryTable';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { createItem } from '../repositories/inventoryRepository';
import { useInventory } from '../hooks/useInventory';
import { AnimatedPage } from '../components/ui/PageHeader';
import { useCapabilities } from '../auth/AuthContext';

/** Inventory management page – shows aggregated table with actions */
const Inventory: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemSku, setNewItemSku] = useState('');
  const [newItemUnit, setNewItemUnit] = useState<'kg' | 'g' | 'l' | 'ml' | 'pz'>('kg');
  const { refresh } = useInventory();
  const { canCreate } = useCapabilities();

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    await createItem({
      name: newItemName,
      sku: newItemSku,
      defaultUnit: newItemUnit,
    });
    setShowCreateModal(false);
    setNewItemName('');
    setNewItemSku('');
    await refresh();
  };

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventario</h1>
          {canCreate && (
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              + Nuovo prodotto
            </Button>
          )}
        </div>

        <div className="bg-white dark:bg-brand-800 rounded-xl shadow-sm border border-gray-200 dark:border-brand-700 p-6">
          <InventoryTable />
        </div>

        {/* Create Item Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Nuovo prodotto"
          size="sm"
        >
          <form onSubmit={handleCreateItem} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Nome prodotto
              </label>
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-brand-600 rounded-xl bg-white dark:bg-brand-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                placeholder="es. Farina 00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                SKU (opzionale)
              </label>
              <input
                type="text"
                value={newItemSku}
                onChange={(e) => setNewItemSku(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-brand-600 rounded-xl bg-white dark:bg-brand-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                placeholder="es. FAR-00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Unità di misura
              </label>
              <select
                value={newItemUnit}
                onChange={(e) => setNewItemUnit(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-brand-600 rounded-xl bg-white dark:bg-brand-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="l">l</option>
                <option value="ml">ml</option>
                <option value="pz">pz</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
                Annulla
              </Button>
              <Button type="submit" variant="primary">
                Crea
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AnimatedPage>
  );
};

export default Inventory;