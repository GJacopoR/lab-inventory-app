import React from 'react';
import { InventoryMovement } from '../../domain/inventoryTypes';

/** Simple movement history table */
export const MovementHistory: React.FC<{ movements: InventoryMovement[] }> = ({ movements }) => {
  if (!movements.length) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Nessuno storico disponibile.</p>;
  }

  return (
    <table className="min-w-full table-auto border border-gray-200 dark:border-brand-700">
      <thead>
        <tr className="bg-gray-100 dark:bg-brand-700">
          <th className="p-2 text-left text-gray-900 dark:text-white">Tipo</th>
          <th className="p-2 text-right text-gray-900 dark:text-white">Delta</th>
          <th className="p-2 text-left text-gray-900 dark:text-white">Unità</th>
          <th className="p-2 text-left text-gray-900 dark:text-white">Motivo</th>
          <th className="p-2 text-left text-gray-900 dark:text-white">Data</th>
        </tr>
      </thead>
      <tbody className="bg-white dark:bg-brand-800 divide-y divide-gray-200 dark:divide-brand-700">
        {movements.map((m) => (
          <tr key={m.id} className="border-t border-gray-200 dark:border-brand-700">
            <td className="p-2 text-gray-900 dark:text-white">{m.type}</td>
            <td className="p-2 text-right text-gray-600 dark:text-gray-300">{m.quantityDelta}</td>
            <td className="p-2 text-gray-600 dark:text-gray-300">{m.unit}</td>
            <td className="p-2 text-gray-600 dark:text-gray-300">{m.reason ?? '-'}
            </td>
            <td className="p-2 text-gray-600 dark:text-gray-300">{new Date(m.createdAt).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
