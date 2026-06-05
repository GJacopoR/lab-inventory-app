import React, { useEffect, useState } from 'react';

/**
 * Lightweight offline indicator component.
 * Shows a subtle banner when the app is offline.
 * Auto-hides when connection returns.
 */
export const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-600 text-white text-center text-sm py-1 px-4">
      📡 Modalità offline - le modifiche saranno sincronizzate al ripristino della connessione
    </div>
  );
};