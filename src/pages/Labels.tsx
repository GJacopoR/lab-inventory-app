import React, { useEffect, useState } from 'react';
import { db } from '../repositories/db';
import { InventoryItem, InventoryLot } from '../domain/inventoryTypes';

/**
 * Labels page – print labels for inventory lots.
 */
const Labels: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [lots, setLots] = useState<InventoryLot[]>([]);
  const [selectedLot, setSelectedLot] = useState<InventoryLot | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const load = async () => {
      const allItems = await db.inventoryItems.toArray();
      setItems(allItems);
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedItemId) {
      setLots([]);
      setSelectedLot(null);
      return;
    }
    const loadLots = async () => {
      const itemLots = await db.inventoryLots.where('itemId').equals(selectedItemId).toArray();
      setLots(itemLots);
    };
    loadLots();
  }, [selectedItemId]);

  useEffect(() => {
    if (showPreview) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showPreview]);

  const handleItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedItemId(e.target.value);
    setShowPreview(false);
  };

  const handleLotSelect = (lot: InventoryLot) => {
    setSelectedLot(lot);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setSelectedLot(null);
  };

  const getSelectedItemName = (): string => {
    const item = items.find(i => i.id === selectedLot?.itemId);
    return item?.name || 'Prodotto sconosciuto';
  };

  const formatDate = (date?: string | null): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('it-IT');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Etichette Lot</h1>

      <div className="bg-white dark:bg-brand-800 rounded-xl border border-gray-200 dark:border-brand-700 p-6">
        <label className="block font-medium mb-2 text-gray-900 dark:text-white">Seleziona prodotto</label>
        <select
          value={selectedItemId}
          onChange={handleItemChange}
          className="w-full max-w-md px-3 py-2 border border-gray-300 dark:border-brand-600 rounded-xl bg-white dark:bg-brand-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
        >
          <option value="">-- Scegli un prodotto --</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.defaultUnit})
            </option>
          ))}
        </select>
      </div>

      {selectedItemId && (
        <div className="bg-white dark:bg-brand-800 rounded-xl border border-gray-200 dark:border-brand-700 p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Lotti disponibili</h2>
          {lots.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">Nessun lotto per questo prodotto.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lots.map((lot) => (
                <div
                  key={lot.id}
                  onClick={() => handleLotSelect(lot)}
                  className="border border-gray-200 dark:border-brand-600 rounded-xl p-4 hover:shadow-md cursor-pointer bg-white dark:bg-brand-800"
                >
                  <div className="font-semibold text-gray-900 dark:text-white text-lg">
                    {lot.lotNumber || lot.id.substring(0, 8)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Qtà: {lot.quantity} {lot.unit}
                  </div>
                  {lot.expiryDate && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Scadenza: {formatDate(lot.expiryDate)}
                    </div>
                  )}
                  {lot.supplier && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Fornitore: {lot.supplier}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showPreview && selectedLot && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-brand-800 rounded-2xl shadow-xl max-w-sm w-full mx-auto">
            <div className="border-2 border-black p-6 text-center">
              <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{getSelectedItemName()}</h2>
              <div className="text-3xl font-mono my-3 text-gray-900 dark:text-white">{selectedLot.lotNumber || selectedLot.id.substring(0, 8)}</div>
              <div className="text-lg text-gray-700 dark:text-gray-300">Qtà: {selectedLot.quantity} {selectedLot.unit}</div>
              {selectedLot.expiryDate && (
                <div className="text-lg text-gray-700 dark:text-gray-300">Scadenza: {formatDate(selectedLot.expiryDate)}</div>
              )}
              {selectedLot.supplier && (
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Fornitore: {selectedLot.supplier}</div>
              )}
            </div>
            <div className="p-4 flex justify-center">
              <button
                onClick={closePreview}
                className="px-6 py-2 bg-gray-200 dark:bg-brand-700 rounded-xl hover:bg-gray-300 dark:hover:bg-brand-600"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreview && selectedLot && (
        <div className="print-label">
          <div className="p-8 max-w-sm mx-auto">
            <div className="border-2 border-black p-6 text-center">
              <h2 className="text-xl font-bold mb-2 print-title">{getSelectedItemName()}</h2>
              <div className="text-3xl font-mono my-3 print-lot">{selectedLot.lotNumber || selectedLot.id.substring(0, 8)}</div>
              <div className="text-lg print-qty">Qtà: {selectedLot.quantity} {selectedLot.unit}</div>
              {selectedLot.expiryDate && (
                <div className="text-lg print-exp">Scadenza: {formatDate(selectedLot.expiryDate)}</div>
              )}
              {selectedLot.supplier && (
                <div className="text-sm mt-1 print-supp">Fornitore: {selectedLot.supplier}</div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-label, .print-label * { visibility: visible !important; }
          .print-label {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Labels;