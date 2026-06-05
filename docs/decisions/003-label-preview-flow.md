# Decision: Shared Label Preview/Print Flow

## Context

RecipeDetail and Labels both needed label preview capability.

## Decision

Single `LabelPreviewModal` component in `src/components/ui/LabelPreviewModal.tsx` used by both pages.

## Consequences

- Consistent preview across both paths
- Clean print output (buttons hidden with `print-none` class)
- Modal has `print-none`, print-only `.print-label` div for actual label
- Labels page auto-triggers `window.print()` after 500ms when `?prep=` URL param present
- Two preview modes: inline modal (RecipeDetail) vs auto-modal + auto-print (Labels with param)