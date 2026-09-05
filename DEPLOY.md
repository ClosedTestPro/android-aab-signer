# Deploy aab.closedtestpro.com

## 1. GitHub repo (public — required for AGPL + Actions)

1. Repo: `ClosedTestPro/android-aab-signer` (public)
2. Push this project to `main`
3. Confirm `.github/workflows/ctp-aab-sign.yml` is present
4. Create a GitHub PAT with `repo` + `workflow`

## 2. Vercel

1. Import the GitHub repo (or deploy via CLI)
2. Framework: Next.js
3. Env vars from `.env.example`:
   - `GITHUB_TOKEN`
   - `GITHUB_OWNER=ClosedTestPro`
   - `GITHUB_REPO=android-aab-signer`
   - `BLOB_READ_WRITE_TOKEN`
4. Deploy production

## 3. DNS (Hostinger)

| Type | Name | Value |
|------|------|-------|
| CNAME | `aab` | `efff7bc39eda9ced.vercel-dns-017.com` (or the value Vercel shows) |

Add domain `aab.closedtestpro.com` on the Vercel project.

## 4. Smoke test

1. Open https://aab.closedtestpro.com
2. Sign a small unsigned AAB with a test keystore
3. Confirm Actions run in the public repo
4. Confirm download works; logs must not print passwords

## Security checklist

- [ ] Repo is **public**
- [ ] Workflow has `::add-mask::` early
- [ ] Cleanup step has `if: always()`
- [ ] `LICENSE` + `NOTICE` remain in the repo
- [ ] No password logging / analytics on secrets
