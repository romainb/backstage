---
'@backstage/eslint-plugin': patch
---

Fixed `no-mixed-plugin-imports` rule suggestion fix functions to return `null` instead of `void` for non-fixable cases, matching the expected `SuggestionReportDescriptor` type in TypeScript 6.
