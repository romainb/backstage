---
'@backstage/plugin-catalog-react': minor
---

**BREAKING ALPHA**: The `EntityContextMenuItemBlueprint` factory now renders BUI `MenuItem` instead of MUI `MenuItem`. MUI icons passed via the `icon` param are automatically sized to fit, but other icon types may render differently. We recommend checking that your custom context menu items look correct and switching to Remixicon equivalents if needed.

```diff
- import DeleteIcon from '@material-ui/icons/Delete';
+ import { RiDeleteBinLine } from '@remixicon/react';

  EntityContextMenuItemBlueprint.make({
    params: {
-     icon: <DeleteIcon fontSize="small" />,
+     icon: <RiDeleteBinLine />,
      useProps: () => ({ ... }),
    },
  });
```
