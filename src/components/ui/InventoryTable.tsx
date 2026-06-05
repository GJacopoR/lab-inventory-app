import React, { useState } from 'react';
import { AggregatedItem } from '../../repositories/inventoryRepository';
import { Button } from './Button';
import { LotFormModal } from './LotFormModal';
import { MovementHistory } from './MovementHistory';
import { useInventory } from '../../hooks/useInventory';
import { InventoryLot } from '../../domain/inventoryTypes';

/**
 * Responsive inventory view.
 * - Desktop: table layout
 * - Mobile: card-based layout
 */
export const InventoryTable: React.FC = () => {
  const {
    items,
    loading,
    search,
    setSearch,
    expiryFilter,
    setExpiryFilter,
    refresh,
    fetchItemDetails,
    fetchMovements,
  } = useInventory();

  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [lots, setLots] = useState<InventoryLot[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [lotModalOpen, setLotModalOpen] = useState(false);
  const [editingLot, setEditingLot] = useState<InventoryLot | null>(null);
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);

  const handleExpand = async (itemId: string) => {
    if (expandedItemId === itemId) {
      setExpandedItemId(null);
      setLots([]);
      setMovements([]);
      return;
    }
    setExpandedItemId(itemId);
    const { lots } = await fetchItemDetails(itemId);
    setLots(lots);
    const moves = await fetchMovements(itemId);
    setMovements(moves);
  };

  const handleAddLot = (itemId: string) => {
    setEditingLot(null);
    setCurrentItemId(itemId);
    setLotModalOpen(true);
  };

  const handleEditLot = (lot: InventoryLot) => {
    setEditingLot(lot);
    setLotModalOpen(true);
  };

  const handleDeleteLot = async (lot: InventoryLot) => {
    const itemName = items.find(i => i.id === lot.itemId)?.name || 'sconosciuto';
    const lotRef = lot.lotNumber || lot.id.substring(0, 8);
    if (!confirm(`Sei sicuro di eliminare il lotto ${lotRef} del prodotto "${itemName}"?`)) return;
    const { deleteLot } = await import('../../repositories/inventoryRepository.js');
    await deleteLot(lot.id);
    if (expandedItemId) {
      const { lots } = await fetchItemDetails(expandedItemId);
      setLots(lots);
    }
    await refresh();
  };

  const handleLotSaved = async () => {
    setLotModalOpen(false);
    if (expandedItemId) {
      const { lots } = await fetchItemDetails(expandedItemId);
      setLots(lots);
    }
    await refresh();
  };

  if (loading) {
    return <p className="text-gray-600 dark:text-gray-400">Caricamento…</p>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <input
          type="text"
          placeholder="Cerca prodotto…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-0 px-3 py-2 border border-gray-300 dark:border-brand-600 rounded-xl bg-white dark:bg-brand-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
        />
        <select
          value={expiryFilter}
          onChange={(e) => setExpiryFilter(e.target.value as any)}
          className="w-full sm:w-40 md:w-48 px-3 py-2 border border-gray-300 dark:border-brand-600 rounded-xl bg-white dark:bg-brand-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">Tutti</option>
          <option value="expiring">Scadenza prossima</option>
          <option value="expired">Scaduti</option>
        </select>
        <Button variant="secondary" onClick={refresh} className="w-full sm:w-auto">
          Aggiorna
        </Button>
      </div>

      {/* Mobile cards view */}
      <div className="md:hidden space-y-3">
        {items.map((it) => (
          <div key={it.id} className="bg-white dark:bg-brand-800 rounded-xl border border-gray-200 dark:border-brand-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">{it.name}</h3>
              <Button variant="secondary" onClick={() => handleExpand(it.id)} className="text-xs py-1 px-2">
                {expandedItemId === it.id ? 'Chiudi' : 'Dettagli'}
              </Button>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <div>Quantità: {it.totalQuantity} {it.unit}</div>
              <div>Scadenza: {it.earliestExpiry ? new Date(it.earliestExpiry).toLocaleDateString() : '-'}</div>
              <div>Lotti: {it.lotCount}</div>
            </div>
            <div className="mt-3">
              <Button variant="primary" onClick={() => handleAddLot(it.id)} className="text-xs py-1 px-2">
                + Lotto
              </Button>
            </div>

            {/* Expanded content */}
            {expandedItemId === it.id && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-brand-700 space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Lotti</h4>
                {lots.map((lot) => (
                  <div key={lot.id} className="bg-gray-50 dark:bg-brand-700/50 rounded-lg p-3">
                    <div className="text-sm space-y-1 mb-2 text-gray-600 dark:text-gray-400">
                      <div>ID: {lot.id.substring(0, 8)}</div>
                      <div>Quantità: {lot.quantity} {lot.unit}</div>
                      <div>Scadenza: {lot.expiryDate ? new Date(lot.expiryDate).toLocaleDateString() : '-'}</div>
                      <div>Fornitore: {lot.supplier ?? '-'}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => handleEditLot(lot)} className="text-xs py-1 px-2">
                        Modifica
                      </Button>
                      <Button variant="ghost" onClick={() => handleDeleteLot(lot)} className="text-xs py-1 px-2">
                        Elimina
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full table-auto border border-gray-200 dark:border-brand-700 rounded-xl overflow-hidden">
          <thead className="bg-gray-50 dark:bg-brand-700">
            <tr>
              <th className="p-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Prodotto</th>
              <th className="p-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Quantità</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Unità</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Scadenza</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Lotti</th>
              <th className="p-3 text-center text-sm font-semibold text-gray-900 dark:text-white w-48">Azioni</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-brand-800 divide-y divide-gray-200 dark:divide-brand-700">
            {items.map((it) => (
              <React.Fragment key={it.id}>
                <tr className="hover:bg-gray-50/50 dark:hover:bg-brand-700/50">
                  <td className="p-3 text-gray-900 dark:text-white">{it.name}</td>
                  <td className="p-3 text-right text-gray-600 dark:text-gray-300">{it.totalQuantity}</td>
                  <td className="p-3 text-gray-600 dark:text-gray-300">{it.unit}</td>
                  <td className="p-3 text-gray-600 dark:text-gray-300">
                    {it.earliestExpiry ? new Date(it.earliestExpiry).toLocaleDateString() : '-'}
                  </td>
                  <td className="p-3 text-center text-gray-600 dark:text-gray-300">{it.lotCount}</td>
                  <td className="p-3">
                    <div className="flex justify-center gap-2">
                      <Button variant="secondary" onClick={() => handleExpand(it.id)} className="text-xs py-1 px-2">
                        {expandedItemId === it.id ? 'Chiudi' : 'Dettagli'}
                      </Button>
                      <Button variant="primary" onClick={() => handleAddLot(it.id)} className="text-xs py-1 px-2">
                        + Lotto
                      </Button>
                    </div>
                  </td>
                </tr>
                {expandedItemId === it.id && (
                  <tr>
                    <td colSpan={6} className="p-4 bg-gray-50/50 dark:bg-brand-900/30">
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900 dark:text-white">Lotti</h4>
                        <table className="min-w-full table-auto border border-gray-200 dark:border-brand-700 rounded-lg overflow-hidden">
                          <thead className="bg-gray-100 dark:bg-brand-700">
                            <tr>
                              <th className="p-2 text-left text-xs font-semibold">ID</th>
                              <th className="p-2 text-left text-xs font-semibold">Quantità</th>
                              <th className="p-2 text-left text-xs font-semibold">Unità</th>
                              <th className="p-2 text-left text-xs font-semibold">Scadenza</th>
                              <th className="p-2 text-left text-xs font-semibold">Fornitore</th>
                              <th className="p-2 text-center text-xs font-semibold w-32">Azioni</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-brand-800 divide-y divide-gray-200 dark:divide-brand-700">
                            {lots.map((lot) => (
                              <tr key={lot.id} className="hover:bg-gray-50/50 dark:hover:bg-brand-700/50">
                                <td className="p-2 text-gray-900 dark:text-white">{lot.id.substring(0, 8)}</td>
                                <td className="p-2 text-gray-600 dark:text-gray-300">{lot.quantity}</td>
                                <td className="p-2 text-gray-600 dark:text-gray-300">{lot.unit}</td>
                                <td className="p-2 text-gray-600 dark:text-gray-300">
                                  {lot.expiryDate ? new Date(lot.expiryDate).toLocaleDateString() : '-'}
                                </td>
                                <td className="p-2 text-gray-600 dark:text-gray-300">{lot.supplier ?? '-'}</td>
                                <td className="p-2">
                                  <div className="flex justify-center gap-1">
                                    <Button variant="secondary" onClick={() => handleEditLot(lot)} className="text-xs py-1 px-2">
                                      Modifica
                                    </Button>
                                    <Button variant="ghost" onClick={() => handleDeleteLot(lot)} className="text-xs py-1 px-2">
                                      Elimina
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <h4 className="font-medium text-gray-900 dark:text-white">Movimenti</h4>
                        <MovementHistory movements={movements} />
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <LotFormModal
        open={lotModalOpen}
        onClose={() => setLotModalOpen(false)}
        onSaved={handleLotSaved}
        editingLot={editingLot}
        itemId={currentItemId ?? undefined}
      />
    </div>
  );
};