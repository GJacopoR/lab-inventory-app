import { useEffect, useState, useCallback } from 'react';
import { AggregatedItem, listAggregatedItems, getItemWithLots, listMovements } from '../repositories/inventoryRepository';
import { InventoryLot, InventoryMovement } from '../domain/inventoryTypes';

/**
 * Hook that encapsulates inventory data loading and UI state.
 * - Loads aggregated items (product‑level view).
 * - Provides search & expiry filtering.
 * - Allows fetching detailed lots and movement history on demand.
 */
export function useInventory() {
  const [items, setItems] = useState<AggregatedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expiryFilter, setExpiryFilter] = useState<'all' | 'expiring' | 'expired'>('all');

  // Refresh aggregated list
  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listAggregatedItems();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Helper to fetch lots for a product
  const fetchItemDetails = useCallback(
    async (itemId: string) => {
      const { item, lots } = await getItemWithLots(itemId);
      return { item, lots } as { item: any; lots: InventoryLot[] };
    },
    []
  );

  // Helper to fetch movements for a product or a specific lot
  const fetchMovements = useCallback(
    async (itemId: string, lotId?: string) => {
      const moves = await listMovements(itemId, lotId);
      return moves as InventoryMovement[];
    },
    []
  );

  // Derived, filtered list based on search & expiry filter
  const filteredItems = items.filter((it) => {
    const matchesSearch = it.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (expiryFilter === 'all') return true;
    if (!it.earliestExpiry) return false;
    const now = new Date();
    const expiry = new Date(it.earliestExpiry);
    if (expiryFilter === 'expired') return expiry < now;
    // expiring soon – define as within next 30 days
    const diff = expiry.getTime() - now.getTime();
    return diff > 0 && diff <= 30 * 24 * 60 * 60 * 1000;
  });

  return {
    items: filteredItems,
    loading,
    search,
    setSearch,
    expiryFilter,
    setExpiryFilter,
    refresh: loadItems,
    fetchItemDetails,
    fetchMovements,
  };
}
