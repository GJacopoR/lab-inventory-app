import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRecipes, usePreparations } from '../hooks/useRecipes';
import { Button } from '../components/ui/Button';
import { LabelPreviewModal } from '../components/ui/LabelPreviewModal';
import { Modal } from '../components/ui/Modal';
import { NumberStepper } from '../components/ui/NumberStepper';
import { AnimatedPage } from '../components/ui/PageHeader';
import { RecipePreparation } from '../domain/recipeTypes';
import { useCapabilities } from '../auth/AuthContext';

/** Detailed view of a single recipe with availability and production */
const RecipeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loadDetail, detail } = useRecipes();
  const { preparations, loadPreparations, createPreparation } = usePreparations();
  const [error, setError] = useState<string | null>(null);
  const [showPrepModal, setShowPrepModal] = useState(false);
  const [prepQuantity, setPrepQuantity] = useState(0);
  const [shelfLife, setShelfLife] = useState<'3_days' | '7_days' | '2_years'>('7_days');
  const [dateType, setDateType] = useState<'best_before' | 'use_by'>('best_before');
  const [storageCond, setStorageCond] = useState<'refrigerated' | 'dry_place'>('refrigerated');
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [selectedPrepForLabel, setSelectedPrepForLabel] = useState<RecipePreparation | null>(null);
  const { canCreate } = useCapabilities();

  // Set initial quantity when recipe loads
  useEffect(() => {
    if (detail?.recipe && prepQuantity === 0) {
      setPrepQuantity(detail.recipe.expectedYield);
    }
  }, [detail?.recipe, prepQuantity]);

  useEffect(() => {
    if (id) {
      loadDetail(id);
      loadPreparations(id);
    }
  }, [id, loadDetail, loadPreparations]);

  // Navigate directly to label preview after creation
  const handleCreatePreparation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!detail) return;
    try {
      const prep = await createPreparation({
        recipeId: detail.recipe.id,
        producedQuantity: prepQuantity || detail.recipe.expectedYield,
        producedUnit: detail.recipe.yieldUnit,
        shelfLifePreset: shelfLife,
        dateType: dateType,
        storageCondition: storageCond,
      });
      // Navigate to Labels page with preparation ID for preview
      navigate(`/labels?prep=${prep.id}`);
      loadPreparations(id!);
    } catch (err: any) {
      setError(err.message || 'Errore nella creazione preparazione');
    }
  };

  const handleViewLabel = (prep: RecipePreparation) => {
    setSelectedPrepForLabel(prep);
    setShowLabelModal(true);
  };

  const closeLabelModal = () => {
    setShowLabelModal(false);
    setSelectedPrepForLabel(null);
  };

  // Back button handler: try navigate(-1), fall back to recipes list
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/recipes');
    }
  };

  if (!detail) {
    return (
      <AnimatedPage>
        <div className="space-y-6 p-4">
          <p className="text-gray-600 dark:text-gray-400">Caricamento…</p>
        </div>
      </AnimatedPage>
    );
  }

  const { recipe, ingredients, availability } = detail;

  return (
    <AnimatedPage>
      <div className="space-y-6 p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-brand-700 text-gray-700 dark:text-gray-300 transition-colors"
            aria-label="Torna indietro"
            title="Torna indietro"
          >
            ←
          </button>
          <h1 className="text-3xl font-bold text-primary-800 dark:text-primary-300">{recipe.name}</h1>
        </div>
        {recipe.description && <p className="text-gray-600 dark:text-gray-300">{recipe.description}</p>}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Ingredienti</h2>
          {/* Mobile card view */}
          <div className="block md:hidden space-y-3 mt-2">
            {ingredients.map((ing) => {
              const avail = availability.find((a) => a.ingredient.id === ing.id);
              return (
                <div key={ing.id} className="bg-white dark:bg-brand-800 rounded-xl border border-gray-200 dark:border-brand-700 p-4">
                  <div className="font-medium text-gray-900 dark:text-white">{ing.itemName || ing.inventoryItemId}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Quantità richiesta: {ing.quantity} {ing.unit}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Disponibilità: {avail?.totalAvailable ?? 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {avail?.sufficient ? 'Sufficiente ✓' : 'Insufficiente ✗'}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Desktop table view */}
          <table className="hidden md:table min-w-full table-auto border mt-2">
            <thead>
              <tr className="bg-gray-100 dark:bg-brand-700">
                <th className="p-2 text-left text-gray-900 dark:text-white">Prodotto</th>
                <th className="p-2 text-right text-gray-900 dark:text-white">Quantità richiesta</th>
                <th className="p-2 text-left text-gray-900 dark:text-white">Unità</th>
                <th className="p-2 text-left text-gray-900 dark:text-white">Disponibilità</th>
                <th className="p-2 text-left text-gray-900 dark:text-white">Sufficiente</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ing) => {
                const avail = availability.find((a) => a.ingredient.id === ing.id);
                return (
                  <tr key={ing.id} className="border-t border-gray-200 dark:border-brand-700">
                    <td className="p-2 text-gray-900 dark:text-white">{ing.itemName || ing.inventoryItemId}</td>
                    <td className="p-2 text-right text-gray-600 dark:text-gray-300">{ing.quantity}</td>
                    <td className="p-2 text-gray-600 dark:text-gray-300">{ing.unit}</td>
                    <td className="p-2 text-gray-600 dark:text-gray-300">{avail?.totalAvailable ?? 0}</td>
                    <td className="p-2 text-gray-600 dark:text-gray-300">{avail?.sufficient ? '✓' : '✗'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {canCreate && (
        <section className="mt-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Preparazione</h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
            Crea una nuova preparazione da questa ricetta e genera l'etichetta.
          </p>
          <Button variant="primary" className="px-6 py-3 text-base" onClick={() => setShowPrepModal(true)}>
            Prepara e stampa etichetta
          </Button>
          {error && <p className="text-red-600 dark:text-red-400 mt-2">{error}</p>}
        </section>
        )}

        {/* Preparations history */}
        {preparations.length > 0 && (
          <section className="mt-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Preparazioni effettuate</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">Clicca su una preparazione per vedere o stampare l'etichetta</p>
            <div className="mt-3 space-y-2">
              {preparations.map((prep) => (
                <div key={prep.id} onClick={() => handleViewLabel(prep)} className="bg-white dark:bg-brand-800 rounded-xl border border-gray-200 dark:border-brand-700 p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{prep.foodNameSnapshot}</h3>
                      <div className="text-sm text-primary-700 dark:text-primary-300 font-mono mt-1">Lotto {prep.lotCode}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-700 dark:text-gray-300">{prep.producedQuantity} {prep.producedUnit}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(prep.producedAt).toLocaleDateString('it-IT')}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Create Preparation Modal */}
        <Modal isOpen={showPrepModal} onClose={() => setShowPrepModal(false)} title="Prepara etichetta" size="md">
          <form onSubmit={handleCreatePreparation} className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Stai preparando: <strong className="text-gray-900 dark:text-white">{recipe.name}</strong>
            </p>

            {/* Essential Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Quantità preparata</label>
                <NumberStepper value={prepQuantity} onChange={setPrepQuantity} unit={recipe.yieldUnit} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Tipo scadenza</label>
                <select
                  value={dateType}
                  onChange={(e) => setDateType(e.target.value as 'best_before' | 'use_by')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-brand-600 rounded-xl bg-white dark:bg-brand-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="best_before">Best before (TMC)</option>
                  <option value="use_by">Scadenza (Use by)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Durata</label>
                <select
                  value={shelfLife}
                  onChange={(e) => setShelfLife(e.target.value as '3_days' | '7_days' | '2_years')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-brand-600 rounded-xl bg-white dark:bg-brand-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="3_days">3 giorni</option>
                  <option value="7_days">7 giorni</option>
                  <option value="2_years">2 anni</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Conservazione</label>
                <select
                  value={storageCond}
                  onChange={(e) => setStorageCond(e.target.value as 'refrigerated' | 'dry_place')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-brand-600 rounded-xl bg-white dark:bg-brand-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="refrigerated">Refrigerato</option>
                  <option value="dry_place">Luogo aspro e secco</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Produttore: Produttore • Stabilimento: IT 0000</p>
              </div>
            </div>

            {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="secondary" onClick={() => setShowPrepModal(false)}>
                Annulla
              </Button>
              <Button type="submit" variant="primary">
                Prepara etichetta
              </Button>
            </div>
          </form>
        </Modal>

        {/* Shared Label Preview Modal for past preparations */}
        <LabelPreviewModal
          isOpen={showLabelModal}
          onClose={closeLabelModal}
          preparation={selectedPrepForLabel}
        />
      </div>
    </AnimatedPage>
  );
};

export default RecipeDetail;