import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRecipes } from '../hooks/useRecipes';
import { Button } from '../components/ui/Button';
import { MovementHistory } from '../components/ui/MovementHistory';
import { InventoryMovement } from '../domain/inventoryTypes';

/** Detailed view of a single recipe with availability and production */
const RecipeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { loadDetail, detail, prepare } = useRecipes();
  const [batches, setBatches] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Gather movements for this recipe's production batches (optional simple view)
  const [prodMovements, setProdMovements] = useState<InventoryMovement[]>([]);
  useEffect(() => {
    // Load movements related to ingredient items for this recipe (simplified)
    // For now we just show all movements (could filter by recipeId via productionBatches link)
    // This placeholder keeps UI simple.
  }, []);

  useEffect(() => {
    if (id) loadDetail(id);
  }, [id, loadDetail]);

  if (!detail) return <p>Caricamento…</p>;

  const { recipe, ingredients, availability } = detail;

  const handlePrepare = async () => {
    setError(null);
    setSuccess(null);
    try {
      await prepare(recipe.id, Number(batches));
      setSuccess('Produzione completata e inventario aggiornato.');
    } catch (e:any) {
      setError(e.message || 'Errore nella produzione');
    }
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-3xl font-bold text-primary-800">{recipe.name}</h1>
      {recipe.description && <p>{recipe.description}</p>}
      <section>
        <h2 className="text-xl font-semibold">Ingredienti</h2>
        <table className="min-w-full table-auto border mt-2">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Prodotto</th>
              <th className="p-2 text-right">Quantità richiesta</th>
              <th className="p-2 text-left">Unità</th>
              <th className="p-2 text-left">Disponibilità</th>
              <th className="p-2 text-left">Sufficiente</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((ing) => {
              const avail = availability.find((a) => a.ingredient.id === ing.id);
              return (
                <tr key={ing.id} className="border-t">
                  <td className="p-2">{ing.inventoryItemId}</td>
                  <td className="p-2 text-right">{ing.quantity}</td>
                  <td className="p-2">{ing.unit}</td>
                  <td className="p-2">{avail?.totalAvailable ?? 0}</td>
                  <td className="p-2">{avail?.sufficient ? '✓' : '✗'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="mt-4">
        <h2 className="text-xl font-semibold">Produzione</h2>
        <p>Yield previsto per batch: {recipe.expectedYield} {recipe.yieldUnit}</p>
        <div className="flex items-center gap-2 mt-2">
          <label className="block">Numero di batch:</label>
          <input type="number" min="1" value={batches} onChange={(e) => setBatches(e.target.value)} className="border rounded p-1 w-20" />
          <Button variant="primary" onClick={handlePrepare}>Prepara!</Button>
        </div>
        {error && <p className="text-red-600 mt-2">{error}</p>}
        {success && <p className="text-green-600 mt-2">{success}</p>}
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold">Storico movimenti</h2>
        <MovementHistory movements={prodMovements} />
      </section>
    </div>
  );
};

export default RecipeDetail;
