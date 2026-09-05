# Closed Test Pro — AAB Signer

Sign Android App Bundles for Google Play from the browser — free, no Android Studio required.

**Live:** https://aab.closedtestpro.com  
**Product:** https://closedtestpro.com

Upload an unsigned `.aab` and your keystore. Signing runs on ephemeral GitHub Actions with `jarsigner`. Inputs are deleted after the job.

## Features

- No account required
- HTTPS upload + ephemeral runners
- Passwords masked in Actions logs
- Cleanup on success and failure
- Open source (AGPL-3.0) — audit every line

## How it works

1. Upload unsigned AAB + keystore in the browser  
2. Files go to temporary blob storage over HTTPS  
3. A GitHub Actions workflow downloads them, runs `jarsigner`, then deletes inputs  
4. Download the signed AAB  

## Stack

| Layer | Tech |
|-------|------|
| App | Next.js, React, TypeScript, Tailwind |
| Hosting | Vercel |
| Signing | GitHub Actions + Java `jarsigner` |
| Temp files | Vercel Blob |

## Local setup

```bash
git clone https://github.com/ClosedTestPro/android-aab-signer.git
cd android-aab-signer
npm install
cp .env.example .env.local
npm run dev
```

### Environment variables

```bash
GITHUB_TOKEN=           # PAT with repo + workflow scopes
GITHUB_OWNER=ClosedTestPro
GITHUB_REPO=android-aab-signer
BLOB_READ_WRITE_TOKEN=  # Vercel Blob token
```

The repo must include `.github/workflows/ctp-aab-sign.yml` with `workflow_dispatch` enabled.

## Limits

| Limit | Value |
|-------|-------|
| Max AAB | 100 MB |
| Max keystore | 10 MB |
| Job timeout | ~10 minutes |
| Artifact retention | ~24 hours |

## Closed Test Pro

Need help with Google Play closed testing (12 testers / 14 days)?

- https://closedtestpro.com/get-12-testers-free  
- https://closedtestpro.com/pricing  
- Support: closedtestpro@gmail.com

## License

GNU Affero General Public License v3.0 — see `LICENSE`.

See `NOTICE` for copyright information.
