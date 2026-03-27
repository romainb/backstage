---
'@backstage/plugin-auth-node': patch
---

Avoid redundant `/userinfo` calls during token refresh by extracting user profile from the ID token when available. This prevents hitting provider rate limits (such as Auth0's per-user `/userinfo` limit) during rapid page reloads. Falls back to `/userinfo` when the ID token is missing, malformed, or lacks sufficient profile claims.
