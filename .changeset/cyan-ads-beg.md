---
'@backstage/plugin-catalog': minor
---

**BREAKING ALPHA**: Migrated the NFS entity page header from MUI to BUI. Custom headers provided via `EntityHeaderBlueprint` now replace the entire BUI Header including tab navigation. Previously, custom headers only replaced the header area above the tabs.

**Migration:**

If you use `EntityHeaderBlueprint.make(...)` to provide a custom entity page header, your custom header now needs to include its own tab navigation if desired. The default BUI Header handles this automatically.
