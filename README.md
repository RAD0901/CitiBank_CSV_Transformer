# CitiBank CSV Transformer

Browser-based converter for turning CitiBank CSV exports into the three-column CSV format expected by Sage Bank Manager.

The current application is a Vite + React + TypeScript single-page app. All file handling and transformation happen client-side in the browser; there is no backend and uploaded files are not sent to a server.

## What the app currently does

- Accepts a single `.csv` file by drag and drop or file picker
- Validates file size, extension, headers, and row-level data
- Detects two CitiBank export layouts: legacy and newer statement exports
- Converts valid rows into Sage Bank Manager format: `Date,Description,Amount`
- Shows processing progress and a preview of the first 5 output rows
- Downloads the generated CSV in the browser using the configured filename template
- Applies saved settings for output date format, amount handling, theme, auto-download, and error handling
- Records processing history metadata in `localStorage`
- Exposes separate Settings and History tabs backed by `localStorage`

## Supported input formats

### Legacy CitiBank export

This format may include metadata rows before the real header:

```csv
Search Criteria: ,,,
From Date: ,07/10/2025,,
To Date: ,08/08/2025,,
Accounts: ,2987066,,
"",,,
Account Number,Value Date,Customer Reference,Amount
2987066,07/31/2025,FSK ELECTRAMECOR,"1,750,000.00"
2987066,07/31/2025,20950P1FR2O," -88,433.98"
```

### Newer CitiBank export

```csv
Value Date,Statement Date,Currency,Amount,Beneficiary/ Remitter,Customer Reference,Type,Description,Narrative
5/08/2026,5/11/2026,ZAR,"'-1,046.50",,ZA1ZMSC261310021,DE-Data Entry,EFT DIRECT DEBIT RETURNED,KUV050              ACCOUNT FROZEN
5/08/2026,5/11/2026,ZAR,'-5198,,ZA1ZMSC26131000R,DE-Data Entry,EFT DIRECT DEBIT RETURNED,ASA060              NOT PROVIDED FOR
```

### Latest CitiBank export (renamed columns)

CitiBank may rename columns. The importer resolves logical fields via aliases, so either naming works:

| Logical field | Accepted headers |
| --- | --- |
| Amount | `Amount`, `Transaction Amount` |
| Beneficiary | `Beneficiary/ Remitter`, `Beneficiary/ Remitter Name` |
| Customer Reference | `Customer Reference`, `Customer Reference Number` |
| Description | `Description`, `Transaction Description` |
| Type | `Type`, `Product Type` |
| Narrative | `Narrative` |
| Statement Date | `Statement Date` |
| Value Date | `Value Date` |
| Account Number | `Account Number` |

Extra columns (Currency, Bank Reference, Product Type, future columns, etc.) are ignored and do not cause validation failures.

```csv
Value Date,Statement Date,Currency,Transaction Amount,Beneficiary/ Remitter Name,Customer Reference Number,Product Type,Transaction Description,Narrative
5/08/2026,5/11/2026,ZAR,"'-1,046.50",,ZA1ZMSC261310021,DE-Data Entry,EFT DIRECT DEBIT RETURNED,KUV050              ACCOUNT FROZEN
```

### Output format

```csv
Date,Description,Amount
31/07/2025,FSK ELECTRAMECOR,1750000.00
31/07/2025,20950P1FR2O,-88433.98
```

## Core transformation logic

The live conversion pipeline is implemented in `src/hooks/useCSVProcessor.tsx`, `src/utils/fileValidator.ts`, and `src/utils/csvTransformer.ts`.

### 1. Format detection

The app scans the CSV line by line until it finds a header row with enough **required business fields** (matched via aliases, not exact full header sets):

- Legacy: `Account Number`, `Value Date`, `Customer Reference`, `Amount` (or aliases)
- New / latest: `Amount`, `Customer Reference`, `Description` (or aliases), plus `Value Date` and/or `Statement Date`

Column order does not matter. Unused columns are ignored.

### 2. Metadata skipping

Legacy exports can contain non-transaction rows such as:

- `Search Criteria:`
- `From Date:`
- `To Date:`
- `Accounts:`
- `""`

These rows are skipped before transaction parsing begins.

### 3. Row normalization

Rows from both CitiBank formats are mapped into a shared internal shape so the rest of the pipeline can process them consistently.

### 4. Validation rules

The converter validates:

- file extension: `.csv` only
- file size: up to 10 MB
- non-empty file content
- presence of a supported header row
- date values in `M/D/YYYY` or `MM/DD/YYYY`
- amount values after cleaning
- required description sources for output rows

Row-level validation behavior:

- Legacy rows require `Value Date`, `Amount`, `Account Number`, and non-empty `Customer Reference`
- New-format debit order rejection rows require non-empty `Narrative`
- New-format payment rows require `Beneficiary/ Remitter` or `Description`
- New-format receipt/deposit rows require `Customer Reference`
- Special case: when `Customer Reference` is `820 0201523001` on a non-payment row, the app uses `Description` instead

### 5. Date transformation

- Legacy rows use `Value Date`
- New-format rows prefer `Statement Date`, falling back to `Value Date`
- Output dates follow the active setting: `DD/MM/YYYY` or `MM/DD/YYYY`

### 6. Amount transformation

The app:

- removes quotes, apostrophes, spaces, and commas as needed
- preserves the sign
- preserves decimal precision by default
- can optionally round or truncate amounts to integers through Settings

Examples:

- `"1,750,000.00"` -> `1750000.00`
- `" -88,433.98"` -> `-88433.98`
- `"'-1,911,566.02"` -> `-1911566.02`

### 7. Description mapping

- Legacy rows: use `Customer Reference`
- New debit order rejection rows where the amount is negative and `Description = EFT DIRECT DEBIT RETURNED`: use `Narrative`
- New payment rows (negative amount): use `Beneficiary/ Remitter`, otherwise fall back to `Description`
- New receipt/deposit rows: use `Customer Reference`
- Internal-reference receipts with `Customer Reference = 820 0201523001`: use `Description`

### 8. Success criteria

The processor skips invalid rows, collects errors, and still returns partial output when possible.

Processing is considered successful only when:

- at least one output row is produced, and
- the success rate is at least 50 percent of processable rows

## User flow

### Converter tab

1. Upload a CSV file
2. Run validation
3. Process the CSV through four stages:
   - parsing
   - finding transaction data
   - transforming records
   - generating output
4. Preview the first 5 converted rows
5. Download the output CSV

### Settings tab

The app includes a settings UI backed by `localStorage` for:

- date format preference
- amount rounding preference
- error handling preference
- filename template
- auto-download toggle
- theme preference
- advanced stats toggle
- export/import/reset of saved settings

### History tab

The app includes a history UI that stores and manages processing-session metadata in `localStorage`, including:

- original and generated filenames
- input and output sizes
- processing duration
- processed/error row counts
- the settings snapshot used for that run

## Important current limitations

The repository still contains some planned or prototype code paths that are not wired into the main converter flow in `src/App.tsx`.

At the moment:

- the live converter only processes one file at a time
- history stores processing metadata only; it does not persist raw uploaded files or generated CSV contents
- re-download from History is not currently available because generated files are not stored
- there are alternate or prototype components in `src/components/advanced/`, `src/components/BasicProcessor.tsx`, `src/components/EnhancedProcessor.tsx`, and `v0.dev_files/` that are not the mounted production path

## Tech stack

- React 19
- TypeScript 5
- Vite 7
- Tailwind CSS 3
- Radix UI / shadcn-style components
- `next-themes` for theme provider support
- ESLint 9

Note: `papaparse` is installed as a dependency, but the current live transformation pipeline uses custom CSV parsing logic in `src/utils/csvTransformer.ts`.

## Repository structure

```text
.
├── src/
│   ├── App.tsx                      # Mounted application shell
│   ├── main.tsx                     # React entry point
│   ├── hooks/
│   │   ├── useCSVProcessor.tsx      # Live processing orchestration
│   │   ├── useSettings.tsx          # Settings storage hook
│   │   └── useHistory.tsx           # History storage hook
│   ├── utils/
│   │   ├── csvTransformer.ts        # Core parsing/transformation logic
│   │   ├── fileValidator.ts         # File and row validation
│   │   ├── constants.ts             # Header lists, errors, progress labels
│   │   └── localStorage.ts          # Settings/history persistence helpers
│   ├── types/
│   │   └── index.ts                 # Shared app types
│   ├── components/
│   │   ├── file-upload-zone.tsx
│   │   ├── processing-stats.tsx
│   │   ├── progress-indicator.tsx
│   │   ├── data-table.tsx
│   │   ├── download-button.tsx
│   │   ├── SettingsPanel.tsx
│   │   ├── HistoryPanel.tsx
│   │   └── ui/                      # Reusable UI primitives
│   └── lib/
│       ├── utils.ts
│       └── enterprise-storage.ts    # Used by prototype/advanced flows
├── public/
│   └── samples/                     # Sample legacy and new-format CSVs
├── .github/workflows/deploy.yml     # GitHub Pages deployment workflow
├── netlify.toml                     # Netlify build, redirects, headers
├── vite.config.ts                   # Vite config, aliases, build splitting
├── tailwind.config.js               # Tailwind config
├── eslint.config.js                 # ESLint config
├── test_decimal_fix.js              # Manual decimal-preservation check
└── v0.dev_files/                    # Reference/generated prototype files
```

## Development setup

### Prerequisites

- Node.js 18+
- npm 9+

### Install and run

```bash
npm install
npm run dev
```

The Vite dev server is configured to run on port `3000`.

### Build and preview

```bash
npm run build
npm run preview
```

The preview server is configured for port `4173`.

## Available scripts

- `npm run dev` - start the Vite development server
- `npm run build` - build the production bundle
- `npm run build:check` - run the build-focused TypeScript config, then build
- `npm run lint` - run ESLint
- `npm run preview` - preview the built app
- `npm run build:netlify` - clean Netlify-style install and build
- `npm run deploy` - build and publish `dist/` with `gh-pages`

## Deployment

### GitHub Pages

The repo includes `.github/workflows/deploy.yml`, which:

- runs on pushes and pull requests targeting `main`
- installs dependencies with `npm ci`
- builds the app
- uploads `dist/`
- deploys to GitHub Pages

### Netlify

The repo also includes `netlify.toml`, which defines:

- build command: `npm run build`
- publish directory: `dist`
- SPA redirect to `index.html`
- security headers
- cache headers for static assets

See `NETLIFY_DEPLOYMENT.md` for additional Netlify notes.

## Sample data

Example input files are included in `public/samples/`:

- `sample_citibank_export.csv` - newer-format payments/receipts
- `NEW_sample_citibank_export.csv` - newer-format debit order rejection examples that use `Narrative` for the output description
- `LATEST_sample_citibank_export.csv` - latest renamed-column export (`Transaction Amount`, `Customer Reference Number`, etc.)

## Testing

There is currently no formal unit-test or end-to-end test suite configured in `package.json`.

The repo does include one manual verification script:

```bash
node test_decimal_fix.js
```

This script checks that amount normalization preserves decimal precision for banking values.

## Notes for maintainers

- `dist/` and `node_modules/` are generated directories
- `src/App.tsx` is the primary source of truth for what is actually mounted in the UI
- several markdown files in the repo describe earlier plans or completed milestones, but this README is intended to describe the current implemented behavior
