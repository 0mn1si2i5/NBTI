# NBTI

Vite + React static app for the NBTI 魏晋南北朝人格测试. The app has no backend, analytics, cookies, or browser storage. Quiz answers stay in memory for the current tab and disappear on refresh or close.

## Commands

```bash
npm install
npm run clean
npm run assets:build
npm run validate:data
npm run validate:docs
npm run validate:privacy
npm run analyze:matching
npm test
npm run typecheck
npm run dev
npm run build
```

Browser checks require Chromium once:

```bash
npx playwright install chromium
npm run test:e2e
```

## Data

- `src/data/people.json`: 32 character results, vectors, copy, avatar paths
- `src/data/questions.json`: 18 scenario questions, 6 five-point calibration items, and balanced deltas
- `src/data/axes.json`: six dimensions and matching weights
- `assets-source/characters/`: lossless source PNG portraits
- `assets-source/nbti-ink-bg.png`: lossless source background
- `public/assets/characters/`: generated WebP portraits; do not edit directly

`npm run clean` removes build output, generated WebP files, test artifacts, TypeScript cache, and Finder metadata. All removed assets are recreated by `npm run assets:build` or the build and validation pre-hooks.

Run `npm run validate:data` after changing people, questions, axes, or character images.

Run `npm run validate:privacy` after changing application code. It rejects network requests, cookies, and browser persistence under `src/`.

`src/data/*.json` is canonical. Run `npm run docs:sync` after accepted data changes; CI rejects stale `docs/people.md` or `docs/questions.md`.

## Docs

- `docs/dimensions.md`
- `docs/people.md`
- `docs/questions.md`
- `docs/product.md`

Editorial review drafts and research packets stay local and are intentionally excluded from the public repository.

## Deploy

`vite.config.ts` uses `base: "./"`, and hash routing keeps every route compatible with a GitHub Pages project subpath. Build output is generated in `dist/`.

The workflow at `.github/workflows/deploy-pages.yml` validates and deploys every push to `main`. In the GitHub repository, open **Settings → Pages** and set **Source** to **GitHub Actions**. The site will then be published at:

```text
https://<account>.github.io/<repository>/
```

If the default branch is not `main`, update the branch name in the workflow.

## License

Source code is MIT licensed. Original copy and character artwork are CC BY-NC 4.0; see `CONTENT_LICENSE.md` and `NOTICE.md` for scope and source-material notes.
