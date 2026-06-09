import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '../repositories/db';
import { RecipePreparation } from '../domain/recipeTypes';
import { LabelPreviewModal } from '../components/ui/LabelPreviewModal';
import { AnimatedPage } from '../components/ui/PageHeader';

/**
 * Labels page – archive and reprint preparation labels.
 */
const Labels: React.FC = () => {
  const location = useLocation();

  const formatDate = (date?: string | null): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('it-IT');
  };

  const searchParams = new URLSearchParams(location.search);
  const prepId = searchParams.get('prep');

  const [preparations, setPreparations] = useState<RecipePreparation[]>([]);
  const [selectedPreparation, setSelectedPreparation] = useState<RecipePreparation | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [search, setSearch] = useState('');

  // Load all preparations on mount
  useEffect(() => {
    const load = async () => {
      const allPreparations = await db.recipePreparations.toArray();
      setPreparations(allPreparations);
    };
    load();
  }, []);

  // Auto-open preview if prep ID is passed in URL - load the specific prep if needed
  useEffect(() => {
    if (prepId && !selectedPreparation) {
      // First check if already in loaded preparations
      const existing = preparations.find(p => p.id === prepId);
      if (existing) {
        setSelectedPreparation(existing);
        setShowPreview(true);
      } else if (preparations.length > 0) {
        // If list loaded but prep not found, try to load it directly
        db.recipePreparations.get(prepId).then(prep => {
          if (prep) {
            setSelectedPreparation(prep);
            setShowPreview(true);
          }
        });
      }
    }
  }, [prepId, preparations, selectedPreparation]);

  // Auto-trigger print when preview opens via URL param (direct from recipe)
  useEffect(() => {
    if (showPreview && prepId) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showPreview, prepId]);

  const filteredPreparations = preparations.filter(p =>
    p.foodNameSnapshot.toLowerCase().includes(search.toLowerCase()) ||
    p.lotCode.toLowerCase().includes(search.toLowerCase())
  );

  const handlePreparationSelect = (prep: RecipePreparation) => {
    setSelectedPreparation(prep);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setSelectedPreparation(null);
  };

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Archivio etichette</h1>
        <p className="text-gray-600 dark:text-gray-400 -mt-4">Cerca e ri-stampa etichette di preparazioni già create</p>

        {/* Search bar */}
        <div className="bg-white dark:bg-brand-800 rounded-xl border border-gray-200 dark:border-brand-700 p-6">
          <label className="block font-medium mb-2 text-gray-900 dark:text-white">Cerca preparazione</label>
          <input
            type="text"
            placeholder="Nome prodotto o numero lotto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 dark:border-brand-600 rounded-xl bg-white dark:bg-brand-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Preparations list */}
        {filteredPreparations.length === 0 ? (
          <div className="bg-white dark:bg-brand-800 rounded-xl border border-gray-200 dark:border-brand-700 p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {search ? '🔍 Nessuna preparazione trovata.' : '📦 Nessuna preparazione presente.'}
            </p>
            {!search && (
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Vai su una ricetta per crearne una nuova.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPreparations.map((prep) => (
              <div
                key={prep.id}
                onClick={() => handlePreparationSelect(prep)}
                className="border border-gray-200 dark:border-brand-600 rounded-xl p-4 hover:shadow-md cursor-pointer bg-white dark:bg-brand-800 transition-shadow"
              >
                <div className="flex flex-col gap-1">
                  <div className="font-semibold text-gray-900 dark:text-white text-lg">
                    {prep.foodNameSnapshot}
                  </div>
                  <div className="font-mono font-bold text-primary-700 dark:text-primary-300">
                    Lotto {prep.lotCode}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {prep.producedQuantity} {prep.producedUnit} • {formatDate(prep.producedAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Shared Label Preview Modal */}
        <LabelPreviewModal
          isOpen={showPreview}
          onClose={closePreview}
          preparation={selectedPreparation}
        />
      </div>
    </AnimatedPage>
  );
};

export default Labels;