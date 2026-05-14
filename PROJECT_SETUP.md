# Project Setup Summary

This file is a lightweight setup snapshot. For the detailed product and logic description, use `README.md` as the primary source of truth.

## Current stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS 3
- shadcn-style/Radix UI components
- `next-themes` for theme switching
- Custom CSV parsing and transformation logic in `src/utils/csvTransformer.ts`

## Current app status

The mounted app in `src/App.tsx` is fully client-side and currently supports:

- single-file CitiBank CSV upload
- legacy and newer CitiBank import formats
- debit order rejection handling via `Narrative`
- configurable output date format
- configurable amount handling (`preserve`, `round`, `truncate`)
- configurable error handling (`skip` or `stop`)
- configurable filename templates and optional auto-download
- settings persistence in `localStorage`
- processing-history metadata persistence in `localStorage`

## Local development

```bash
npm install
npm run dev
```

Current dev server config:

- dev: `http://localhost:3000`
- preview: `http://localhost:4173`

## Build status

The project builds successfully with:

```bash
npm run build
```

## Notes

- All processing happens in the browser
- Uploaded files are not sent to a backend
- History stores metadata only, not raw files or regenerated CSV contents
- Prototype/reference code still exists in `src/components/advanced/`, `src/components/BasicProcessor.tsx`, `src/components/EnhancedProcessor.tsx`, and `v0.dev_files/`
