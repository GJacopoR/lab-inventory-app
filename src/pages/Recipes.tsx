import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useRecipes } from '../hooks/useRecipes';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { listAggregatedItems, AggregatedItem } from '../repositories/inventoryRepository';

/** Recipe list page with modal-based create form */
const Recipes: React.FC = () => {
  const { recipes, loading, refresh } = useRecipes();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ricette</h1>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          + Nuova ricetta
        </Button>
      </div>

      {loading ? (
        <p className="text-gray-600 dark:text-gray-400">Caricamento…</p>
      ) : recipes.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">Nessuna ricetta presente.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((r) => (
            <Link
              key={r.id}
              to={`/recipes/${r.id}`}
              className="block bg-white dark:bg-brand-800 rounded-xl border border-gray-200 dark:border-brand-700 p-4 hover:shadow-md hover:-translate-y-1 transition-all"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white">{r.name}</h3>
            </Link>
          ))}
        </div>
      )}

      <CreateRecipeModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSaved={() => {
          setShowCreateModal(false);
          refresh();
        }}
      />
    </div>
  );
};

// Modal-based create recipe form
function CreateRecipeModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [expectedYield, setExpectedYield] = useState('');
  const [yieldUnit, setYieldUnit] = useState('');
  const [ingredients, setIngredients] = useState<Array<{ inventoryItemId: string; quantity: string; unit: string }>>([]);
  const [items, setItems] = useState<AggregatedItem[]>([]);

  useEffect(() => {
    (async () => {
      const agg = await listAggregatedItems();
      setItems(agg);
    })();
  }, []);

  const addIngredientLine = () => {
    setIngredients((prev) => [...prev, { inventoryItemId: '', quantity: '', unit: '' }]);
  };

  const updateIngredient = (index: number, field: keyof typeof ingredients[0], value: string) => {
    setIngredients((prev) => {
      const copy = [...prev];
      (copy[index] as any)[field] = value;
      return copy;
    });
  };

  const removeIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validIngredients = ingredients.filter(
      (ing) => ing.inventoryItemId && Number(ing.quantity) > 0 && ing.unit
    );
    const { createRecipe } = await import('../repositories/recipeRepository');
    await createRecipe({
      name,
      description: '',
      expectedYield: Number(expectedYield),
      yieldUnit,
      ingredients: validIngredients.map((ing) => ({
        inventoryItemId: ing.inventoryItemId,
        quantity: Number(ing.quantity),
        unit: ing.unit,
      })),
    });
    onSaved();
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Nuova ricetta" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Nome</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-brand-600 rounded-xl bg-white dark:bg-brand-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Yield previsto</label>
            <input
              value={expectedYield}
              onChange={(e) => setExpectedYield(e.target.value)}
              type="number"
              className="w-full px-3 py-2 border border-gray-300 dark:border-brand-600 rounded-xl bg-white dark:bg-brand-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Unità di yield</label>
            <input
              value={yieldUnit}
              onChange={(e) => setYieldUnit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-brand-600 rounded-xl bg-white dark:bg-brand-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900 dark:text-white">Ingredienti</h3>
            <Button type="button" variant="secondary" onClick={addIngredientLine} className="text-xs py-1 px-2">
              + Aggiungi
            </Button>
          </div>
          {ingredients.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Nessun ingrediente aggiunto.</p>
          ) : (
            <div className="space-y-2">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select
                    value={ing.inventoryItemId}
                    onChange={(e) => updateIngredient(idx, 'inventoryItemId', e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-brand-600 rounded-lg bg-white dark:bg-brand-700 text-gray-900 dark:text-white text-sm"
                    required
                  >
                    <option value="">Seleziona prodotto</option>
                    {items.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    placeholder="Qtà"
                    value={ing.quantity}
                    onChange={(e) => updateIngredient(idx, 'quantity', e.target.value)}
                    className="w-20 px-2 py-1.5 border border-gray-300 dark:border-brand-600 rounded-lg bg-white dark:bg-brand-700 text-gray-900 dark:text-white text-sm"
                    required
                  />
                  <input
                    placeholder="Unità"
                    value={ing.unit}
                    onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                    className="w-20 px-2 py-1.5 border border-gray-300 dark:border-brand-600 rounded-lg bg-white dark:bg-brand-700 text-gray-900 dark:text-white text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeIngredient(idx)}
                    className="px-2 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annulla
          </Button>
          <Button type="submit" variant="primary">
            Crea
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default Recipes;