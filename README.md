# CitiBank CSV Transformer

Browser-based converter for turning CitiBank CSV exports into the three-column CSV format expected by Sage Bank Manager.

The current application is a Vite + React + TypeScript single-page app. All file handling and transformation happen client-side in the browser; there is no backend and uploaded files are not sent to a server.

This README describes the **current live application behaviour** as implemented in:

- `src/hooks/useCSVProcessor.tsx` — processing orchestration, progress, and error state
- `src/utils/fileValidator.ts` — file checks, header alias resolution, format detection
- `src/utils/csvTransformer.ts` — parsing, validation, transformation, output generation
- `src/utils/constants.ts` — aliases, required fields, error messages, constraints
- `src/types/index.ts` — shared types (`NormalizedCitiBankRow`, `ValidationError`, `ProcessingResult`, …)
- `src/App.tsx` — mounted UI flow

## What the app currently does

- Accepts a single `.csv` file by drag and drop or file picker
- Validates file size, extension, structure, and row-level data
- Detects CitiBank export variants (legacy, newer statement, and latest renamed-column exports) via **header alias mapping** and **required business fields**
- Converts valid rows into Sage Bank Manager format: `Date,Description,Amount`
- Shows processing progress and a preview of the first 5 output rows
- Surfaces structured validation / processing errors when conversion fails
- Downloads the generated CSV in the browser using the configured filename template
- Applies saved settings for output date format, amount handling, theme, auto-download, and error handling
- Records processing history metadata in `localStorage`
- Exposes separate Settings and History tabs backed by `localStorage`

## Backward compatibility

All previously supported CitiBank workflows continue to work:

| Variant | Status |
| --- | --- |
| Legacy CitiBank exports (with metadata preamble) | Supported |
| Original newer statement exports (`Amount`, `Beneficiary/ Remitter`, `Description`, …) | Supported |
| Debit-order rejection exports (Narrative mapping) | Supported |
| Latest CitiBank exports with renamed columns (`Transaction Amount`, `Customer Reference Number`, …) | Supported |

**Sage Bank Manager output format is unchanged:** always `Date,Description,Amount`.

Transformation rules (dates, amounts, description mapping, debit-order Narrative handling, and the `820 0201523001` special case) are unchanged. Recent work improved import detection, header mapping, validation messaging, and error/loading state handling only.

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

CitiBank’s newest exports rename several columns. Examples of renamed headers:

- `Transaction Amount` (was `Amount`)
- `Beneficiary/ Remitter Name` (was `Beneficiary/ Remitter`)
- `Customer Reference Number` (was `Customer Reference`)
- `Product Type` (was `Type`)
- `Transaction Description` (was `Description`)
- `Narrative` (unchanged when present)

The importer supports these through header aliases (see below). Extra columns may also appear and are ignored.

```csv
Value Date,Statement Date,Currency,Transaction Amount,Beneficiary/ Remitter Name,Customer Reference Number,Product Type,Transaction Description,Narrative
5/08/2026,5/11/2026,ZAR,"'-1,046.50",,ZA1ZMSC261310021,DE-Data Entry,EFT DIRECT DEBIT RETURNED,KUV050              ACCOUNT FROZEN
```

### Output format

Sage Bank Manager import CSV (unchanged across all input variants):

```csv
Date,Description,Amount
31/07/2025,FSK ELECTRAMECOR,1750000.00
31/07/2025,20950P1FR2O,-88433.98
```

Descriptions that contain commas or quotes are written as quoted CSV fields with escaped quotes.

---

## Header Alias Mapping

Defined in `src/utils/constants.ts` as `HEADER_ALIASES`.

The importer resolves **logical fields** instead of requiring exact column names. Any listed alias for a field is accepted. Headers are normalized (trim + strip surrounding quotes) before matching.

### Amount

- `Amount`
- `Transaction Amount`

### Beneficiary

- `Beneficiary/ Remitter`
- `Beneficiary/ Remitter Name`

### Customer Reference

- `Customer Reference`
- `Customer Reference Number`

### Description

- `Description`
- `Transaction Description`

### Type

- `Type`
- `Product Type`

### Narrative

- `Narrative`

### Statement Date

- `Statement Date`

### Value Date

- `Value Date`

### Account Number

- `Account Number`

### Bank Reference

- `Bank Reference`

When multiple aliases for the same logical field appear, the first matching alias in the list above wins.

---

## Format detection

The importer **does not** require an exact full header layout.

It scans the CSV line by line until it finds a header row with enough **required business fields**, resolved through aliases:

| Detected format | Required logical fields |
| --- | --- |
| **New / latest** (checked first) | `amount`, `customerReference`, `description`, **and** at least one of `valueDate` or `statementDate` |
| **Legacy** (fallback) | `accountNumber`, `valueDate`, `customerReference`, `amount` |

Behavioural details:

- Column **order does not matter**
- **Additional columns are ignored** and do not cause format rejection
- Optional columns may appear or disappear without affecting recognition, as long as the required business fields remain
- If both legacy-style and new-style fields are present, detection prefers **new** when a Description alias is present
- Unsupported layouts produce a user-facing message listing detected vs missing fields

---

## Flexible column handling

The importer only uses fields required for transformation and row validation. Unknown CitiBank columns do not break imports.

### Used for transformation / validation

| Logical field | Role |
| --- | --- |
| Value Date | Legacy date source; new-format fallback date; new-format detection |
| Statement Date | Preferred date for new-format rows |
| Amount / Transaction Amount | Amount cleaning and payment vs receipt sign |
| Beneficiary / Beneficiary Name | Payment description (negative amounts) |
| Customer Reference / Number | Legacy description; receipts; required on rows |
| Description / Transaction Description | Payments fallback; receipts with internal ref; debit-order identification |
| Narrative | Debit-order rejection output description |
| Account Number | **Legacy only** — required for legacy row validation |

### Mapped but not used in Sage output rules

These may be stored on the normalized row when present, but they do not drive Date / Description / Amount output:

- `Type` / `Product Type`
- `Bank Reference`

### Ignored when present

Any column that is not in `HEADER_ALIASES` is ignored entirely, including for example:

- `Currency`
- Future CitiBank metadata columns
- Internal / unused export columns

Future CitiBank columns should not break imports unless CitiBank renames or removes a **required business field** without a matching alias.

---

## CSV normalization and robustness

Custom CSV parsing (not Papa Parse) handles common export variations:

- Quoted headers and quoted values
- Leading/trailing whitespace around cells and headers
- Surrounding quotes stripped from headers during normalization
- Varying column order
- Optional / unused columns
- Header aliases for renamed CitiBank fields
- Mixed date inputs currently accepted by the app: `M/D/YYYY` and `MM/DD/YYYY`

This improves compatibility when CitiBank changes export layout without changing the underlying business data.

---

## Core transformation logic

The live conversion pipeline is implemented in `src/hooks/useCSVProcessor.tsx`, `src/utils/fileValidator.ts`, and `src/utils/csvTransformer.ts`.

### 1. Format detection

See [Format detection](#format-detection) above.

### 2. Metadata skipping

Legacy exports can contain non-transaction rows such as:

- `Search Criteria:`
- `From Date:`
- `To Date:`
- `Accounts:`
- `""`

These rows (and blank lines) are skipped before and during transaction parsing.

### 3. Row normalization

Rows from all supported CitiBank variants are mapped into a shared internal shape (`NormalizedCitiBankRow`) so the rest of the pipeline can process them consistently. Mapping uses the logical field map built from header aliases.

A data row is retained for processing when it has:

- a non-empty amount, and
- a date (`Value Date`, or for new format `Statement Date` if `Value Date` is blank)

### 4. Validation rules

#### File-level

- Extension: `.csv` only
- Size: up to 10 MB
- Non-empty file content
- Presence of a supported header row (required business fields)
- At least one non-metadata data row after the header

#### Row-level

- Dates must be valid calendar dates in `M/D/YYYY` or `MM/DD/YYYY`
- Amounts must parse as numbers after cleaning quotes, spaces, apostrophes, and commas
- Legacy rows require `Value Date`, `Amount`, `Account Number`, and non-empty `Customer Reference`
- New-format rows require a usable date (`Statement Date` preferred, else `Value Date`), `Amount`, and non-empty `Customer Reference`
- New-format debit order rejection rows require non-empty `Narrative` (see below)
- New-format payment rows (negative amount) require `Beneficiary/ Remitter` (or alias) **or** `Description` (or alias)
- New-format receipt/deposit rows require `Customer Reference` (already enforced as a required field); when reference is `820 0201523001`, `Description` is required for the output description

#### Structured error shape

Validation / processing errors are collected as:

```ts
{
  row: number;    // 0 = file/structure level; otherwise source CSV row number
  field: string;
  value: string;
  message: string;
}
```

### 5. Date transformation

- Legacy rows use `Value Date`
- New-format rows prefer `Statement Date`, falling back to `Value Date`
- Output dates follow the active setting: `DD/MM/YYYY` (default) or `MM/DD/YYYY`

### 6. Amount transformation

The app:

- removes quotes, apostrophes, and spaces
- removes thousands-separator commas
- preserves the sign
- preserves decimal precision by default
- can optionally round or truncate amounts to integers through Settings (`round` / `truncate`)

Examples:

- `"1,750,000.00"` → `1750000.00`
- `" -88,433.98"` → `-88433.98`
- `"'-1,911,566.02"` → `-1911566.02`

### 7. Description mapping

- **Legacy rows:** use `Customer Reference`
- **New debit order rejection rows** (see dedicated section below): use `Narrative`
- **New payment rows** (negative amount): use `Beneficiary/ Remitter` (or alias), otherwise fall back to `Description` (or alias)
- **New receipt/deposit rows:** use `Customer Reference`
- **Internal-reference receipts** with `Customer Reference = 820 0201523001`: use `Description` (or alias)

### 8. Success criteria

The processor skips invalid rows (unless Settings error handling is `stop`), collects errors, and can still return partial output.

Processing is considered successful only when:

- at least one output row is produced, **and**
- the success rate is at least **50%** of processable rows

If the structure was detected but every transaction row failed validation, the result includes:

> No valid transactions found. The file structure was detected successfully but all transaction rows failed validation.

---

## Debit order rejection processing

Applies to **new / latest** format rows only.

### Identification

A row is treated as a debit order rejection when **both** are true:

1. Amount &lt; 0 (after normal amount cleaning)
2. Description / Transaction Description (trimmed) equals exactly:

   `EFT DIRECT DEBIT RETURNED`

### Output description

For those rows:

**Output Description = Narrative**

If Narrative is missing or blank, the row fails validation with a message such as:

```text
Debit order rejection row missing Narrative.

Row 18
```

### Example

**Input**

| Field | Value |
| --- | --- |
| Amount / Transaction Amount | `'-1,046.50` |
| Description / Transaction Description | `EFT DIRECT DEBIT RETURNED` |
| Narrative | `KUV050              ACCOUNT FROZEN` |
| Statement Date | `5/11/2026` |

**Output**

```csv
Date,Description,Amount
11/05/2026,"KUV050              ACCOUNT FROZEN",-1046.50
```

(Default date setting `DD/MM/YYYY`; Narrative whitespace is preserved as exported.)

---

## Error handling

### Processing state

`useCSVProcessor` always finishes in a terminal UI state:

- Success → preview / download
- Failure → error panel with messages and a way to try another file

`isProcessing` is cleared in a `finally` block so the UI **cannot remain indefinitely** on “Processing your CSV file…”.

Validation failures, structure failures, and unexpected exceptions all produce a `ProcessingResult` with `success: false` and populated `errors`.

### What users see

Failures are surfaced in the Converter tab with the primary error message and additional tips (further error messages). Examples:

**Unsupported format**

```text
Unsupported CitiBank format.

Detected:
- Transaction Amount
- Product Type

Missing:
- Value Date
- Description
```

(Exact detected/missing lists depend on the file.)

**Invalid amount**

```text
Row 42:

Invalid amount:
ABC123
```

**Invalid date**

```text
Row 10: Invalid date:
32/13/2025
```

**No valid transactions**

```text
No valid transactions found. The file structure was detected successfully but all transaction rows failed validation.
```

**Debit order rejection without Narrative**

```text
Debit order rejection row missing Narrative.

Row 18
```

### Settings: error handling mode

- `skip` (typical): invalid rows are recorded and skipped; valid rows still produce output
- `stop`: processing stops at the first row-level validation/transformation error

---

## User flow

### Converter tab

1. Upload a CSV file
2. Client-side file checks (extension / size)
3. Process the CSV through four stages:
   - parsing (includes structure validation)
   - finding transaction data
   - transforming records
   - generating output
4. On success: preview the first 5 converted rows, then download
5. On failure: show structured error messages; processing state is cleared so the user can retry

### Settings tab

The app includes a settings UI backed by `localStorage` for:

- date format preference
- amount rounding preference
- error handling preference (`skip` / `stop`)
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

History does **not** store the original upload or the generated CSV bytes.

## Important current limitations

The repository still contains some planned or prototype code paths that are not wired into the main converter flow in `src/App.tsx`.

At the moment:

- the live converter only processes one file at a time
- history stores processing metadata only; it does not persist raw uploaded files or generated CSV contents
- re-download from History is not currently available because generated files are not stored
- there are alternate or prototype components in `src/components/advanced/`, `src/components/BasicProcessor.tsx`, `src/components/EnhancedProcessor.tsx`, and `v0.dev_files/` that are not the mounted production path
- `papaparse` is installed as a dependency but the live pipeline uses custom CSV parsing
- some older TypeScript interfaces (`CitiBankTransaction`, `CitiBankNewTransaction`) still name classic column labels; runtime mapping uses `HEADER_ALIASES` / `NormalizedCitiBankRow`

## Tech stack

- React 19
- TypeScript 5
- Vite 7
- Tailwind CSS 3
- Radix UI / shadcn-style components
- `next-themes` for theme provider support
- ESLint 9

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
│   │   ├── fileValidator.ts         # File validation, aliases, format detection
│   │   ├── constants.ts             # HEADER_ALIASES, errors, progress labels
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
│   └── samples/                     # Sample legacy, new, and latest CSVs
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

- `sample_citibank_export.csv` — newer-format payments/receipts (classic column names)
- `NEW_sample_citibank_export.csv` — newer-format debit order rejection examples (`Narrative` → output Description)
- `LATEST_sample_citibank_export.csv` — latest renamed-column export (`Transaction Amount`, `Customer Reference Number`, `Transaction Description`, etc.)

## Testing

There is currently no formal unit-test or end-to-end test suite configured in `package.json`.

The repo does include one manual verification script:

```bash
node test_decimal_fix.js
```

This script checks that amount normalization preserves decimal precision for banking values.

When changing import behaviour, manually verify all three sample files still convert, and that Sage output columns remain `Date,Description,Amount`.

## Notes for maintainers

- `dist/` and `node_modules/` are generated directories
- `src/App.tsx` is the primary source of truth for what is actually mounted in the UI
- `HEADER_ALIASES` in `src/utils/constants.ts` is the control point for new CitiBank column renames — prefer adding an alias over hardcoding a new exact header layout
- `LEGACY_REQUIRED_HEADERS` / `NEW_REQUIRED_HEADERS` in constants are **deprecated reference lists**; live detection uses `LEGACY_REQUIRED_FIELDS` / `NEW_REQUIRED_FIELDS` plus aliases
- `FILE_CONSTRAINTS.requiredHeaders` still lists the legacy four-column set for historical typing; live structure validation does **not** use that array for format detection
- several markdown files in the repo describe earlier plans or completed milestones, but **this README is the definitive description of current implemented behaviour**

### Recommendations when CitiBank changes exports again

1. Compare the new header row to `HEADER_ALIASES`.
2. If a required business field was only renamed, add the new name to the existing alias list.
3. If a brand-new unused column appears, no code change is required (it will be ignored).
4. If a required field is removed with no replacement, detection or row validation will fail — update aliases/required fields and add a sample CSV under `public/samples/`.
5. Do **not** change Sage output columns or description/amount/date business rules unless product owners explicitly request it.
6. Keep debit-order identification tied to exact text `EFT DIRECT DEBIT RETURNED` unless CitiBank changes that wording — then update `isDebitOrderRejectionRow` and this README together.
