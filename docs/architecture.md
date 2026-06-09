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