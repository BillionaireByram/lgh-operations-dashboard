---
title: Commander Dashboard Self-Heal
status: active
domain: clients/lgh
owner: DigitalFlo
updated: 2026-05-12
---

# Commander Dashboard Self-Heal

Commander is allowed to repair low-risk LGH dashboard bugs when the fix is code-only, reversible, and verifiable.

## Production

- Site: `https://lgh-operations-dashboard.netlify.app`
- Netlify site ID: `e39603b8-b195-4a96-b849-1561232ef3f3`
- Current source branch: `codex/lgh-command-center-next`

## Guarded Flow

1. Reproduce the live dashboard bug.
2. Patch the smallest owner file.
3. Run `npm run build`.
4. Run `netlify build --context production`.
5. Deploy with:

```bash
netlify deploy \
  --prod \
  --no-build \
  --dir .netlify/static \
  --functions .netlify/functions \
  --site e39603b8-b195-4a96-b849-1561232ef3f3 \
  --message "Commander: <short fix>" \
  --timeout 300
```

6. Verify the production route after the deploy is `ready`.
7. For form bugs, verify the actual submit/click path and confirm no browser console or page errors.

## Escalate Instead

Do not self-heal without approval when the fix requires bulk database writes, destructive migrations, GHL workflow edits, ad spend changes, billing changes, credential rotation, or customer-facing mass messages.
