# Deployment Summary

This file is a compact deployment snapshot. For step-by-step deployment instructions, use `NETLIFY_DEPLOYMENT.md`.

## Current deployment state

The app is a static, client-side React/Vite application and is suitable for:

- GitHub Pages deployment via `.github/workflows/deploy.yml`
- Netlify deployment via `netlify.toml`

## Current build assumptions

- build command: `npm run build`
- output directory: `dist`
- Node.js: 18+

## Current implementation notes

- all CSV processing stays in the browser
- settings and history use browser `localStorage`
- uploaded files and generated CSV contents are not sent to a backend

## Verification

Current production verification should always be based on a fresh local build:

```bash
npm run build
```

## Source of truth

- deployment steps: `NETLIFY_DEPLOYMENT.md`
- product behavior: `README.md`
