---
'@backstage/plugin-scaffolder': patch
---

Fixed `IterableDirectoryHandle` interface to use `Omit<FileSystemDirectoryHandle, 'values'>` for TypeScript 6 compatibility, avoiding an incompatible `values()` return type.
