# Architecture

## App Structure

```
src/
├── main.tsx              # App entry point
├── App.tsx               # Router configuration
├── components/           # Reusable UI components
│   ├── ui/             # Styled primitives (Button, Modal, etc.)
│   └── ProtectedRoute.tsx
├── pages/                # Route-level components
│   ├── Dashboard.tsx
│   ├── Inventory.tsx
│   ├── Recipes.tsx
│   ├── RecipeDetail.tsx  # Preparation workflow + inline label preview
│   ├── Documents.tsx     # OCR-assisted intake
│   ├── Labels.tsx        # Label archive + shared preview modal
│   ├── Settings.tsx      # Backup/restore UI
│   └── Login.tsx         # Auth entry
├── hooks/                # React hooks
│   └── useRecipes.ts
├── repositories/         # Data access layer
│   ├── db.ts             # Dexie schema and singleton
│   ├── backupRepository.ts # Export/restore functions
│   ├── documentRepository.ts
│   ├── inventoryRepository.ts
│   └── recipeRepository.ts
└── domain/               # Domain types (recipeTypes.ts, inventoryTypes.ts, documentTypes.ts)
```

## Shell/Layout

- `AuthenticatedShell` wraps all protected routes
- Mobile: header + collapsible nav + content
- Desktop: sidebar (64) + main content (flex-1)
- Includes `OfflineIndicator` and `UpdatePrompt`

## Label/Recipe/Flow

1. **RecipeDetail**: View recipe, click "Prepara e stampa etichetta"
2. **Modal**: Enter quantity, shelf life, storage
3. **Create**: Saves `RecipePreparation` to IndexedDB via `createRecipePreparation`
4. **Redirect**: Navigate to `/labels?prep=<id>`
5. **Labels page**: Auto-opens preview modal, triggers `window.print()` after 500ms delay
6. **Print**: User clicks "Stampa etichetta" or uses browser print

Two preview paths:
- Inline modal on RecipeDetail for past preparations
- Auto-preview on Labels page when arriving via `?prep=` URL param

## OCR Flow

OCR processing lives in `src/util/ocr.ts` (using Tesseract.js). The flow:

1. **Text extraction**: `extractTextFromFile()` runs OCR with `ita+eng` language for Italian invoice recognition
2. **Layout detection**: `detectLayout()` classifies documents as `tabular` (column-based DDT/invoices), `freeform`, or `unknown` by scoring lines against column keywords (Quantità, Prezzo, Importo, Lotto, Descrizione, Articolo, etc.)
3. **Supplier detection**: `detectSupplier()` matches known suppliers — `eurofish` (eurofish napoli, eurofish s.r.l, eurofish srl), `rossi`, `mangim`
4. **Header extraction**: `extractHeader()` parses document number (including DDT format `2268 | PE2026`), document date (validated year 2000-2099), supplier name; filters address lines
5. **Tabular parser**: `parseTabular()` processes column-based layouts by finding quantity+unit patterns below the detected column header row, with product name extracted from text preceding the quantity match
6. **Generic parser**: `parseGeneric()` handles freeform documents with noise filtering (`isGarbageLine`), header/footer line skipping (`isHeaderOrFooterLine`), lot code detection without `lotto:` prefix (`findLotCode`), and KGx unit support
7. **Validation**: `normalizeDate()` validates year/month/day ranges; `validateItem()` checks quantity bounds, product name length, unit standard, and expiry date
8. **Public API**: `extractTextFromFile`, `parseDocumentText`, `validateHeader`, `validateLineItem`

## Data Model (Dexie)

13 tables defined in `src/repositories/db.ts`:

| Table | Source | Notes |
|-------|--------|-------|
| `users` | `src/models.ts` | Auth users (bcrypt password hash) |
| `suppliers` | `src/models.ts` | Supplier master data |
| `products` | `src/models.ts` | Legacy product master data |
| `lots` | `src/models.ts` | Legacy lot tracking |
| `movements` | `src/models.ts` | Legacy stock movements |
| `inventoryItems` | `src/domain/inventoryTypes.ts` | Primary inventory items |
| `inventoryLots` | `src/domain/inventoryTypes.ts` | Lot tracking with expiry |
| `inventoryMovements` | `src/domain/inventoryTypes.ts` | Stock movements |
| `recipes` | `src/domain/recipeTypes.ts` | Recipe master data |
| `recipeIngredients` | `src/domain/recipeTypes.ts` | Recipe-ingredient links |
| `productionBatches` | `src/domain/recipeTypes.ts` | Historical production records |
| `recipePreparations` | `src/domain/recipeTypes.ts` | Preparation records for label printing |
| `documents` | `src/domain/documentTypes.ts` | OCR metadata (binaries stored separately) |

## Backup/Restore

- All 11 active entity tables exported via `backupRepository.ts`
- Validation checks `version === '1.0'`, `exportedAt`, and all 11 entity arrays
- Legacy tables `lots` and `movements` are **not** included in backup
- Restore runs in transaction: clears then bulk-adds all tables
- Settings page provides export/import UI with confirmation dialog