import React, { useEffect, useState } from 'react';
import { Button } from './Button';
import { createLot, updateLot } from '../../repositories/inventoryRepository';
import { InventoryLot } from '../../domain/inventoryTypes';

/** Simple modal for adding or editing a lot. */
export const LotFormModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingLot: InventoryLot | null;
  itemId?: string;
}> = ({ open, onClose, onSaved, editingLot, itemId: propItemId }) => {
  const [itemId, setItemId] = useState(propItemId || '');
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState('kg');
  const [expiryDate, setExpiryDate] = useState('');
  const [supplier, setSupplier] = useState('');

  // When opened for editing, populate fields.
  useEffect(() => {
    if (editingLot) {
      setItemId(editingLot.itemId);
      setQuantity(editingLot.quantity);
      setUnit(editingLot.unit);
      setExpiryDate(editingLot.expiryDate ?? '');
      setSupplier(editingLot.supplier ?? '');
    } else {
      setItemId('');
      setQuantity(0);
      setUnit('kg');
      setExpiryDate('');
      setSupplier('');
    }
  }, [editingLot, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId) return;
    if (editingLot) {
      await updateLot(editingLot.id, {
        quantity,
        unit,
        expiryDate: expiryDate || null,
        supplier: supplier || undefined,
      });
    } else {
      await createLot({
        itemId,
        quantity,
        unit,
        expiryDate: expiryDate || null,
        supplier: supplier || undefined,
      });
    }
    onSaved();
  };

  // Use dialog element - styled for dark mode
  return (
    open ? (
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white dark:bg-brand-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-brand-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingLot ? 'Modifica Lotto' : 'Aggiungi Lotto'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-brand-700 text-gray-500 dark:text-gray-400"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Quantità</label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-brand-600 rounded-xl bg-white dark:bg-brand-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Unità</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-brand-600 rounded-xl bg-white dark:bg-brand-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="l">l</option>
                <option value="ml">ml</option>
                <option value="pz">pz</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Scadenza</label>
              <input
                type="date"
                value={expiryDate || ''}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-brand-600 rounded-xl bg-white dark:bg-brand-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Fornitore</label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-brand-600 rounded-xl bg-white dark:bg-brand-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                placeholder="Nome fornitore"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Annulla
              </Button>
              <Button type="submit" variant="primary">
                Salva
              </Button>
            </div>
          </form>
        </div>
      </div>
    ) : null
  );
};