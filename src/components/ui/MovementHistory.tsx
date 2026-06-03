import React from 'react';
import { InventoryMovement } from '../../domain/inventoryTypes';

/** Simple movement history table */
export const MovementHistory: React.FC<{ movements: InventoryMovement[] }> = ({ movements }) => {
  if (!movements.length) {
    return <p className="text-sm text-gray-500">Nessuno storico disponibile.</p>;
  }

  return (
    <table className="min-w-full table-auto border">
      <thead>
        <tr className="bg-gray-100">
          <th className="p-2 text-left">Tipo</th>
          <th className="p-2 text-right">Delta</th>
          <th className="p-2 text-left">Unità</th>
          <th className="p-2 text-left">Motivo</th>
          <th className="p-2 text-left">Data</th>
        </tr>
      </thead>
      <tbody>
        {movements.map((m) => (
          <tr key={m.id} className="border-t">
            <td className="p-2">{m.type}</td>
            <td className="p-2 text-right">{m.quantityDelta}</td>
            <td className="p-2">{m.unit}</td>
            <td className="p-2">{m.reason ?? '-'}
            </td>
            <td className="p-2">{new Date(m.createdAt).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
