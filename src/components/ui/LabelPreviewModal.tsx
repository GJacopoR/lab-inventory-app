import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { RecipePreparation, StorageCondition } from '../../domain/recipeTypes';

interface LabelPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  preparation: RecipePreparation | null;
}

const allergenLabels: Record<string, string> = {
  cereals_containing_gluten: 'Cereali contenenti glutine',
  crustaceans: 'Crostacei',
  eggs: 'Uova',
  fish: 'Pesce',
  peanuts: 'Arachidi',
  soybeans: 'Soia',
  milk: 'Latte',
  nuts: 'Noci',
  celery: 'Sedano',
  mustard: 'Senape',
  sesame: 'Sesamo',
  sulphites: 'Sulfiti',
  lupin: 'Lupino',
  molluscs: 'Molluschi',
};

export const LabelPreviewModal: React.FC<LabelPreviewModalProps> = ({
  isOpen,
  onClose,
  preparation,
}) => {
  const formatDate = (date?: string | null): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('it-IT');
  };

  const getDateLabel = (prep: RecipePreparation): string => {
    const dateStr = formatDate(prep.expiresAt);
    if (prep.dateType === 'best_before') {
      return `Best before: ${dateStr}`;
    }
    return `Scadenza: ${dateStr}`;
  };

  const getStorageLabel = (condition: StorageCondition): string => {
    if (condition === 'refrigerated') return 'Conservare refrigerato';
    return 'Conservare in luogo aspro e secco';
  };

  if (!preparation) return null;

  return (
    <>
      {/* Modal preview - not printed */}
      <Modal isOpen={isOpen} onClose={onClose} title="Anteprima etichetta" size="sm">
        <div className="border-2 border-black p-6 text-center print-none">
          {/* Food Name - PRIMARY */}
          <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white print-title">
            {preparation.foodNameSnapshot}
          </h2>

          {/* Lot Code - SECONDARY */}
          <div className="text-xl font-mono mb-2 text-primary-700 dark:text-primary-300 print-lot">
            {preparation.lotCode}
          </div>

          {/* Net Quantity */}
          <div className="text-lg text-gray-700 dark:text-gray-300 mb-3 print-qty">
            Quantità netta: {preparation.producedQuantity} {preparation.producedUnit}
          </div>

          {/* Ingredients with allergens highlighted */}
          <div className="text-left border-t border-b border-gray-300 py-3 mb-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Ingredienti:</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {preparation.ingredientSnapshot.map((ing, idx) => {
                const isAllergen = preparation.allergenSnapshot.some(t => ing.allergenTags.includes(t));
                return (
                  <span key={ing.itemId}>
                    {idx > 0 && ', '}
                    <span className={isAllergen ? 'font-bold text-red-700 dark:text-red-400' : ''}>
                      {ing.labelName}
                    </span>
                    {isAllergen && ing.allergenTags.length > 0 && (
                      <span className="text-2xs italic text-red-600 dark:text-red-500">
                        {' '}({ing.allergenTags.map(t => allergenLabels[t] || t).join(', ')})
                      </span>
                    )}
                  </span>
                );
              })}
            </p>
          </div>

          {/* Date marking */}
          <div className="text-lg text-gray-700 dark:text-gray-300 mb-2 print-date">{getDateLabel(preparation)}</div>

          {/* Storage conditions */}
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 print-storage">{getStorageLabel(preparation.storageCondition)}</div>

          {/* Operator and Plant - de-emphasized */}
          <div className="text-xs text-gray-500 dark:text-gray-500 print-info">
            {preparation.operatorName} - {preparation.plantCode}
          </div>
        </div>

        <div className="p-4 flex justify-center gap-3 print-none">
          <Button variant="primary" onClick={() => window.print()}>Stampa etichetta</Button>
          <Button variant="secondary" onClick={onClose}>Chiudi</Button>
        </div>
      </Modal>

      {/* Print-only label (hidden until print) */}
      {isOpen && (
        <>
          <style>{`
            @media print {
              body * { visibility: hidden; }
              .print-label, .print-label * { visibility: visible !important; }
              .print-none { display: none !important; }
              .print-label {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
              }
            }
          `}</style>
          <div className="print-label">
          <div className="p-8 max-w-sm mx-auto">
            <div className="border-2 border-black p-6 text-center">
              <h2 className="text-2xl font-bold mb-2 print-title">{preparation.foodNameSnapshot}</h2>
              <div className="text-xl font-mono mb-2 print-lot">{preparation.lotCode}</div>
              <div className="text-lg print-qty mb-3">Quantità netta: {preparation.producedQuantity} {preparation.producedUnit}</div>

              <div className="text-left border-t border-b border-gray-300 py-3 mb-3">
                <p className="text-sm font-semibold mb-1">Ingredienti:</p>
                <p className="text-sm leading-relaxed">
                  {preparation.ingredientSnapshot.map((ing, idx) => {
                    const isAllergen = preparation.allergenSnapshot.some(t => ing.allergenTags.includes(t));
                    return (
                      <span key={ing.itemId}>
                        {idx > 0 && ', '}
                        <span className={isAllergen ? 'font-bold text-red-700' : ''}>
                          {ing.labelName}
                        </span>
                        {isAllergen && ing.allergenTags.length > 0 && (
                          <span className="text-2xs italic">
                            {' '}({ing.allergenTags.map(t => allergenLabels[t] || t).join(', ')})
                          </span>
                        )}
                      </span>
                    );
                  })}
                </p>
              </div>

              <div className="text-lg mb-2 print-date">{getDateLabel(preparation)}</div>
              <div className="text-sm mb-2 print-storage">{getStorageLabel(preparation.storageCondition)}</div>
              <div className="text-xs print-info">{preparation.operatorName} - {preparation.plantCode}</div>
            </div>
          </div>
          </div>
        </>
      )}
    </>
  );
};