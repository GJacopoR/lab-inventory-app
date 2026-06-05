import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { exportBackup, restoreBackup } from '../repositories/backupRepository';

/**
 * Settings page – data backup and restore.
 */
const Settings: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  const handleExport = async () => {
    setError(null);
    setSuccess(null);
    try {
      const backup = await exportBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lab-inventory-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess('Backup esportato con successo');
    } catch (err: any) {
      setError(err.message || 'Errore durante l\'esportazione');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await restoreBackup(data, true);
      setSuccess('Dati importati con successo. La pagina verrà ricaricata.');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setError(err.message || 'Errore durante l\'importazione');
    }
  };

  const requestImportConfirm = () => {
    setShowConfirm(true);
  };

  const cancelImport = () => {
    setShowConfirm(false);
    setFileInputKey(k => k + 1); // Reset file input
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Impostazioni</h1>

      {/* Backup section */}
      <section className="bg-white dark:bg-brand-800 rounded-xl border border-gray-200 dark:border-brand-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Backup dati</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Esporta tutti i dati dell'app in un file JSON. Conserva questo file in un posto sicuro.
        </p>
        <Button variant="primary" onClick={handleExport}>
          Esporta dati
        </Button>
      </section>

      {/* Restore section */}
      <section className="bg-white dark:bg-brand-800 rounded-xl border border-gray-200 dark:border-brand-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Ripristina dati</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Importa un backup precedente. <strong>Attenzione:</strong> i dati esistenti verranno sovrascritti.
        </p>

        {showConfirm ? (
          <div className="border border-red-200 bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
              Sei sicuro? Questa operazione sostituirà tutti i dati esistenti.
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={cancelImport}>Annulla</Button>
              <Button variant="primary" onClick={() => {
                // Trigger file input click
                document.getElementById('restore-file-input')?.click();
              }}>
                Conferma e scegli file
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="secondary" onClick={requestImportConfirm}>
            Ripristina dati
          </Button>
        )}

        <input
          key={fileInputKey}
          id="restore-file-input"
          type="file"
          accept=".json,application/json"
          onChange={handleImport}
          className="hidden"
        />
      </section>

      {/* Feedback */}
      {error && <p className="text-red-600 dark:text-red-400 mt-2">{error}</p>}
      {success && <p className="text-green-600 dark:text-green-400 mt-2">{success}</p>}
    </div>
  );
};

export default Settings;