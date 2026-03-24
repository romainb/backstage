---
'@backstage/frontend-plugin-api': patch
---

Simplified internal extension types for TypeScript 6 compatibility. Replaced the type-level quicksort in `MakeSortedExtensionsMap` with a direct mapped type, extracted a shared `InputOverrideValue` helper in `ResolvedInputValueOverrides`, and added an index-signature guard to `FlattenedMessages` to prevent infinite type recursion.
