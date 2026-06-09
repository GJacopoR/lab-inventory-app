# Data Safety

## Backup Contents

The export includes 11 entity tables (see Architecture for full table list). See `src/repositories/backupRepository.ts` for the exact list.

- **Note**: Legacy tables `lots` and `movements` are **not** included in backup
- Only `inventoryItems`, `inventoryLots`, `inventoryMovements` are backed up for inventory
- All recipe tables are backed up

Metadata: `version` ('1.0'), `exportedAt` (ISO timestamp).

## Restore Behavior

- **Destructive**: Restore completely replaces current data (all 11 tables cleared)
- Confirmation dialog required on Settings page before import
- Validation: rejects invalid files with "File di backup non valido o corrotto"
- Transaction ensures atomicity
- Page auto-refreshes on success

## Validation Rules

1. Must be an object (not null, string, array)
2. `version === '1.0'`
3. `exportedAt` is a valid string
4. All 11 entity keys exist as arrays

## Limitations

- No incremental backup (full export only)
- No encryption (plain text JSON)
- No auto-backup (manual trigger)
- Document binaries not included
- Device-local data (no sync)
- Legacy `lots`/`movements` tables not backed up

## Recovery Strategy

1. Export regularly: Settings → Export
2. Store backup files securely
3. Restore via Settings → Ripristina dati
4. Verify Dashboard and Recipes load after restore