---
'@backstage/cli-module-actions': patch
---

Improved CLI output formatting and UX for the actions module. The `list` command now groups actions by plugin source with colored headers and action titles. The `execute --help` command renders full action details with markdown descriptions and a proper usage line. Complex schema types like objects and arrays are now supported as JSON flags. Error messages now show the actual server response instead of generic status codes. The `sources add` and `sources remove` commands accept multiple plugin IDs at once.
