import React, { useEffect, useState } from 'react';
import { Button } from './Button';

/**
 * Update prompt component.
 * Shows when a new service worker is waiting to activate.
 * Allows user to refresh and get the new version.
 */
export const UpdatePrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Check if there's an update waiting on initial load
      const checkWaiting = async () => {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg?.waiting) setShowPrompt(true);
      };
      checkWaiting();
    }
  }, []);

  const handleUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    }
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 bg-white dark:bg-brand-800 border border-primary-200 dark:border-primary-700 rounded-lg shadow-lg p-4 flex items-center justify-between">
      <span className="text-sm text-gray-700 dark:text-gray-300">
        🔄 Nuova versione disponibile
      </span>
      <Button variant="primary" className="px-3 py-1 text-sm" onClick={handleUpdate}>
        Aggiorna ora
      </Button>
    </div>
  );
};