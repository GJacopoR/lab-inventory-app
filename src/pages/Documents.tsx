import React, { useState, useEffect } from 'react';
import { extractTextFromFile, parseDocumentText, validateHeader, validateLineItem } from '../util/ocr';
import { documentRepo } from '../repositories/documentRepository';
import { db } from '../repositories/db';
import { createLot, createItem } from '../repositories/inventoryRepository';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { NumberStepper } from '../components/ui/NumberStepper';
import { DocumentLineItem, DocumentHeader, DocumentFields } from '../domain/documentTypes';

/**
 * Documents page – full OCR workflow with supplier-aware parsing.
 */
const Documents: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'processing' | 'error'>('idle');
  const [rawText, setRawText] = useState('');
  const [header, setHeader] = useState<DocumentHeader & { needsReview?: boolean }>({
    documentNumber: '',
    documentDate: '',
    supplierName: '',
    notes: '',
    needsReview: true,
  });
  const [items, setItems] = useState<(DocumentLineItem & { needsReview?: boolean; reviewReasons?: string[] })[]>([]);
  const [history, setHistory] = useState<Array<any>>([]);

  useEffect(() => {
    const load = async () => {
      const docs = await documentRepo.getAll();
      setHistory(docs.reverse());
    };
    load();
  }, []);

  const resetForm = () => {
    setFile(null);
    setRawText('');
    setHeader({
      documentNumber: '',
      documentDate: '',
      supplierName: '',
      notes: '',
      needsReview: true,
    });
    setItems([]);
    setOcrStatus('idle');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    if (!['image/', 'application/pdf'].some((type) => f.type.startsWith(type))) {
      alert('Formato file non supportato. Usa immagini o PDF.');
      return;
    }
    setFile(f);
  };

  const runOcr = async (f: File) => {
    setOcrStatus('processing');
    try {
      let imageFile = f;
      if (f.type === 'application/pdf') {
        const pdfjsLib = await import('pdfjs-dist');
        (pdfjsLib as any).GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${(pdfjsLib as any).version}/pdf.worker.min.js`;
        const pdf = await pdfjsLib.getDocument({ data: await f.arrayBuffer() }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        const renderContext = { canvasContext: context!, viewport };
        await page.render(renderContext).promise;
        const blob = await new Promise<Blob>((res) => canvas.toBlob(res as any, 'image/png'));
        imageFile = new File([blob], `${f.name}-page1.png`, { type: 'image/png' });
      }
      const text = await extractTextFromFile(imageFile);
      setRawText(text);
      const parsed = parseDocumentText(text);
      setHeader({
        documentNumber: parsed.header.documentNumber || '',
        documentDate: parsed.header.documentDate || '',
        supplierName: parsed.header.supplierName || '',
        notes: parsed.header.notes || '',
        needsReview: parsed.header.needsReview || false,
      });
      setItems(parsed.items as any);
      setOcrStatus('idle');
    } catch (e) {
      console.error(e);
      setOcrStatus('error');
      alert('OCR fallito. Controlla il file e riprova.');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    await runOcr(file);
  };

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setHeader((prev) => ({ ...prev, [name]: value, needsReview: false }));
  };

  const handleItemChange = (id: string, field: keyof DocumentLineItem, value: string | number | null | undefined) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value, needsReview: false } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addItem = () => {
    const newItem: DocumentLineItem & { needsReview: boolean } = {
      id: genItemId(),
      productName: '',
      quantity: undefined,
      unit: '',
      lotCode: '',
      expiryDate: '',
      notes: '',
      matchedItemId: null,
      needsReview: true,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const saveDocument = async () => {
    if (!file) return;
    const extractedFields: DocumentFields = {
      header,
      items: items.map(({ needsReview, reviewReasons, ...item }) => item) as DocumentLineItem[],
    };
    const doc = {
      fileName: file.name,
      fileData: await fileToBase64(file),
      rawText,
      extractedFields,
      status: 'saved' as const,
      createdAt: new Date().toISOString(),
    };
    await documentRepo.add(doc);
    alert('Documento salvato.');
    const docs = await documentRepo.getAll();
    setHistory(docs.reverse());
    resetForm();
  };

  const createInventoryFromItems = async () => {
    const validItems = items.filter((item) => {
      const validation = validateLineItem(item);
      return !item.needsReview && validation.isValid;
    });

    if (validItems.length === 0) {
      alert('Nessun prodotto valido e verificato. Controlla le righe evidenziate.');
      return;
    }

    let createdCount = 0;
    for (const item of validItems) {
      const matches = await db.inventoryItems
        .where('name')
        .equals(item.productName)
        .toArray();

      if (matches.length > 1) {
        alert('Più prodotti corrispondono. Seleziona manualmente nella schermata Inventario.');
        continue;
      }

      if (matches.length === 0) {
        if (window.confirm(`Creare nuovo prodotto "${item.productName}"?`)) {
          const newItem = await createItem({
            name: item.productName,
            sku: '',
            defaultUnit: item.unit || 'pz',
            notes: '',
          });
          const itemId = newItem.id;
          const unit = item.unit || newItem.defaultUnit;
          if (window.confirm(`Creare lotto per "${item.productName}" con quantità ${item.quantity} ${unit}?`)) {
            await createLot({
              itemId,
              lotNumber: item.lotCode,
              quantity: item.quantity || 0,
              unit,
              expiryDate: item.expiryDate || null,
              supplier: header.supplierName,
              purchaseDocumentRef: header.documentNumber,
            });
            createdCount++;
          }
        }
        continue;
      }

      const itemId = matches[0].id;
      const unit = item.unit || matches[0].defaultUnit;
      if (window.confirm(`Creare lotto per "${matches[0].name}" con quantità ${item.quantity} ${unit}?`)) {
        await createLot({
          itemId,
          lotNumber: item.lotCode,
          quantity: item.quantity || 0,
          unit,
          expiryDate: item.expiryDate || null,
          supplier: header.supplierName,
          purchaseDocumentRef: header.documentNumber,
        });
        createdCount++;
      }
    }

    if (createdCount > 0) {
      alert(`${createdCount} lotto/i creato/i.`);
    }
  };

  // ----- Render -----
  const headerValidation = validateHeader(header);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documenti</h1>
      </div>

      {/* Upload area */}
      <div className="bg-white dark:bg-brand-800 rounded-xl border border-gray-200 dark:border-brand-700 p-6">
        <label className="block font-medium mb-2 text-gray-900 dark:text-white">Carica immagine o PDF</label>
        {/* Visually hidden file input with accessible label */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            id="file-upload"
            className="sr-only"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 text-center"
          >
            Scegli file...
          </label>
          {file && (
            <span className="text-gray-700 dark:text-gray-300 break-all text-sm">
              {file.name}
            </span>
          )}
        </div>
        {file && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0 mt-4">
            <Button onClick={handleUpload} disabled={ocrStatus === 'processing'} variant="primary" className="w-full sm:w-auto">
              {ocrStatus === 'processing' ? 'Elaborazione...' : 'Esegui OCR'}
            </Button>
          </div>
        )}
      </div>

      {/* OCR progress / raw text */}
      {ocrStatus === 'processing' && (
        <p className="text-blue-600 dark:text-blue-400">Elaborazione OCR in corso…</p>
      )}
      {rawText && (
        <div className="bg-white dark:bg-brand-800 rounded-xl border border-gray-200 dark:border-brand-700 p-4">
          <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Testo estratto (OCR)</h2>
          <textarea
            readOnly
            value={rawText}
            rows={6}
            className="w-full p-2 border border-gray-300 dark:border-brand-600 rounded-xl bg-gray-50 dark:bg-brand-700 font-mono text-sm"
          />
        </div>
      )}

      {/* Editable header fields */}
      {rawText && (
        <div className="bg-white dark:bg-brand-800 rounded-xl border border-gray-200 dark:border-brand-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Intestazione documento</h2>
            {header.needsReview && (
              <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-2 py-1 rounded">
                Da verificare
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                Numero documento {header.needsReview && headerValidation.missingFields.includes('documentNumber') && <span className="text-red-500">*</span>}
              </label>
              <input
                name="documentNumber"
                value={header.documentNumber || ''}
                onChange={handleHeaderChange}
                className="w-full border border-gray-300 dark:border-brand-600 rounded-xl p-2 bg-white dark:bg-brand-700"
                placeholder="Es. DDT-2024-001"
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                Data documento {header.needsReview && headerValidation.missingFields.includes('documentDate') && <span className="text-red-500">*</span>}
              </label>
              <input
                name="documentDate"
                type="date"
                value={header.documentDate || ''}
                onChange={handleHeaderChange}
                className="w-full border border-gray-300 dark:border-brand-600 rounded-xl p-2 bg-white dark:bg-brand-700"
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                Fornitore {header.needsReview && headerValidation.missingFields.includes('supplierName') && <span className="text-red-500">*</span>}
              </label>
              <input
                name="supplierName"
                value={header.supplierName || ''}
                onChange={handleHeaderChange}
                className="w-full border border-gray-300 dark:border-brand-600 rounded-xl p-2 bg-white dark:bg-brand-700"
                placeholder="Nome fornitore"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">Note documento</label>
              <textarea
                name="notes"
                value={header.notes || ''}
                onChange={handleHeaderChange}
                rows={2}
                className="w-full border border-gray-300 dark:border-brand-600 rounded-xl p-2 bg-white dark:bg-brand-700"
                placeholder="Note aggiuntive"
              />
            </div>
          </div>
        </div>
      )}

      {/* Line items grid */}
      {rawText && (
        <div className="bg-white dark:bg-brand-800 rounded-xl border border-gray-200 dark:border-brand-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Righe prodotto</h2>
            <Button onClick={addItem} variant="secondary" className="text-sm">
              + Aggiungi riga
            </Button>
          </div>

          {items.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">Nessuna riga prodotto estratta. Aggiungi manualmente o verifica il testo OCR.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-brand-700">
                    <th className="p-2 text-left w-2/5 text-gray-900 dark:text-white">Prodotto</th>
                    <th className="p-2 text-left w-1/6 text-gray-900 dark:text-white">Quantità</th>
                    <th className="p-2 text-left w-1/6 text-gray-900 dark:text-white">Unità</th>
                    <th className="p-2 text-left w-1/6 text-gray-900 dark:text-white">Lotto</th>
                    <th className="p-2 text-left w-1/6 text-gray-900 dark:text-white">Scadenza</th>
                    <th className="p-2 text-left w-1/6 text-gray-900 dark:text-white">Note</th>
                    <th className="p-2 text-center w-16 text-gray-900 dark:text-white">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className={`${item.needsReview ? 'bg-yellow-50/50 dark:bg-yellow-900/20' : ''}`}>
                      <td className="p-1">
                        <input
                          value={item.productName}
                          onChange={(e) => handleItemChange(item.id, 'productName', e.target.value)}
                          className={`w-full border border-gray-300 dark:border-brand-600 rounded-xl p-2 text-sm bg-white dark:bg-brand-700 ${item.needsReview ? 'border-yellow-400' : ''}`}
                          placeholder="Nome prodotto"
                        />
                        {item.reviewReasons && item.reviewReasons.length > 0 && (
                          <div className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">{item.reviewReasons.join(', ')}</div>
                        )}
                      </td>
                      <td className="p-1">
                        <NumberStepper
                          value={item.quantity || 0}
                          onChange={(v) => handleItemChange(item.id, 'quantity', v)}
                          unit={item.unit || 'pz'}
                          min={0}
                        />
                      </td>
                      <td className="p-1">
                        <select
                          value={item.unit || ''}
                          onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                          className={`w-full border border-gray-300 dark:border-brand-600 rounded-xl p-2 text-sm bg-white dark:bg-brand-700 ${item.needsReview ? 'border-yellow-400' : ''}`}
                        >
                          <option value="">Unità</option>
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="l">l</option>
                          <option value="ml">ml</option>
                          <option value="pz">pz</option>
                        </select>
                      </td>
                      <td className="p-1">
                        <input
                          value={item.lotCode || ''}
                          onChange={(e) => handleItemChange(item.id, 'lotCode', e.target.value)}
                          className={`w-full border border-gray-300 dark:border-brand-600 rounded-xl p-2 text-sm bg-white dark:bg-brand-700 ${item.needsReview ? 'border-yellow-400' : ''}`}
                          placeholder="Lotto"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="date"
                          value={item.expiryDate || ''}
                          onChange={(e) => handleItemChange(item.id, 'expiryDate', e.target.value)}
                          className={`w-full border border-gray-300 dark:border-brand-600 rounded-xl p-2 text-sm bg-white dark:bg-brand-700 ${item.needsReview ? 'border-yellow-400' : ''}`}
                        />
                      </td>
                      <td className="p-1">
                        <input
                          value={item.notes || ''}
                          onChange={(e) => handleItemChange(item.id, 'notes', e.target.value)}
                          className={`w-full border border-gray-300 dark:border-brand-600 rounded-xl p-2 text-sm bg-white dark:bg-brand-700 ${item.needsReview ? 'border-yellow-400' : ''}`}
                          placeholder="Note"
                        />
                      </td>
                      <td className="p-1 text-center">
                        <Button
                          onClick={() => removeItem(item.id)}
                          variant="ghost"
                          className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          Rimuovi
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      {rawText && (
        <div className="flex gap-3">
          <Button onClick={saveDocument} variant="secondary">Salva Documento</Button>
          <Button onClick={createInventoryFromItems} disabled={items.some(i => i.needsReview)}>
            Crea lotti inventario {items.some(i => i.needsReview) && '(verifica righe)'}
          </Button>
        </div>
      )}

      {/* History table */}
      <div className="bg-white dark:bg-brand-800 rounded-xl border border-gray-200 dark:border-brand-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Cronologia Documenti</h2>
        {history.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">Nessun documento ancora.</p>
        ) : (
          <>
            {/* Mobile card view */}
            <div className="md:hidden space-y-3">
              {history.map((doc) => (
                <div key={doc.id} className="bg-gray-50 dark:bg-brand-900/30 rounded-lg p-3 border border-gray-200 dark:border-brand-700">
                  <div className="font-medium text-gray-900 dark:text-white break-all">{doc.fileName}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">{new Date(doc.createdAt).toLocaleString()}</div>
                  <div className="mt-2"><StatusBadge status={doc.status} /></div>
                </div>
              ))}
            </div>
            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-brand-700">
                    <th className="p-2 text-left text-gray-900 dark:text-white">Nome file</th>
                    <th className="p-2 text-left text-gray-900 dark:text-white">Data</th>
                    <th className="p-2 text-left text-gray-900 dark:text-white">Stato</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((doc) => (
                    <tr key={doc.id} className="border-t border-gray-200 dark:border-brand-700">
                      <td className="p-2 text-gray-900 dark:text-white">{doc.fileName}</td>
                      <td className="p-2 text-gray-600 dark:text-gray-300">{new Date(doc.createdAt).toLocaleString()}</td>
                      <td className="p-2"><StatusBadge status={doc.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

function genItemId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export default Documents;