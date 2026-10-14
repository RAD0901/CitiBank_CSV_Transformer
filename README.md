# CitiBank CSV Transformer

Browser-based converter for turning CitiBank CSV exports into the three-column CSV format expected by Sage Bank Manager.

The current application is a Vite + React + TypeScript single-page app. All file handling and transformation happen client-side in the browser; there is no backend and uploaded files are not sent to a server.

This README is the **definitive source of truth** for live behaviour, as implemented in:

- `src/hooks/useCSVProcessor.tsx` — processing orchestration, progress, and error state
- `src/utils/fileValidator.ts` — file checks, header alias resolution, format detection
- `src/utils/csvTransformer.ts` — parsing, `getOutputDescription()`, transformation, output generation
- `src/utils/constants.ts` — `HEADER_ALIASES`, description rule constants, error messages
- `src/types/index.ts` — `NormalizedCitiBankRow`, `ValidationError`, `ProcessingResult`, …
- `src/App.tsx` — mounted UI flow

## What the app currently does

- Accepts a single `.csv` file by drag and drop or file picker
- Validates file size, extension, structure, and row-level data
- Detects CitiBank export variants via **dynamic header alias mapping** and **required business fields**
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
| Debit-order rejection exports (`EFT DIRECT DEBIT RETURNED` → Narrative) | Supported |
| Renamed-column exports (`Transaction Amount`, `Customer Reference Number`, …) | Supported |
| Latest transaction exports including `Payment Details` (`NEW_Transaction_citibank.csv`) | Supported |

**Sage Bank Manager output format is unchanged:** always `Date,Description,Amount`.

Decimal cleaning, date formatting settings, download behaviour, Settings, and History are unchanged. Recent work adds resilient header resolution and a rule-driven description resolver.

---

## Supported input formats

### Legacy CitiBank export

May include metadata rows before the real header:

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

### Newer / renamed CitiBank export

```csv
Value Date,Statement Date,Currency,Amount,Beneficiary/ Remitter,Customer Reference,Type,Description,Narrative
5/08/2026,5/11/2026,ZAR,"'-1,046.50",,ZA1ZMSC261310021,DE-Data Entry,EFT DIRECT DEBIT RETURNED,KUV050              ACCOUNT FROZEN
```

Renamed variants may use `Transaction Amount`, `Beneficiary/ Remitter Name`, `Customer Reference Number`, `Product Type`, `Transaction Description`, etc.

### Latest transaction export (with Payment Details)

Primary business fields in current CitiBank transaction exports:

- Statement Date
- Beneficiary/ Remitter Name
- Transaction Amount
- Customer Reference Number
- Account Number
- Account Name
- Narrative
- Payment Details
- Transaction Description
- Value Date

Column order must never matter. Example:

```csv
"Statement Date","Beneficiary/ Remitter Name","Transaction Amount","Customer Reference Number","Account Number","Account Name","Narrative","Payment Details","Transaction Description","Value Date"
"10/13/2026","MICROSOFT","'-107,042.59","282605Z1X3C","2987074","SABRE","","23700                              INVOICE G183104571","CUSTOMER  WIRE TRANSFER","10/13/2026"
"10/13/2026","SABRE","36,054.80","TRSS24 Hour Reac","2987074","SABRE","196005                 ELECTRONIC PAYM,NED","TRSS24 HOUR REACTION","INCOMING CLEARING TRANSFER","10/13/2026"
"10/08/2026","","'-6,647.00","ZA1ZMSC26281002P","2987074","SABRE","THE150 UNPAIDS","","INCOMING DIRECT DEBIT","10/07/2026"
```

### Output format

Sage Bank Manager import CSV (unchanged across all input variants):

```csv
Date,Description,Amount
13/10/2026,"TRSS24 HOUR REACTION",36054.80
08/10/2026,"THE150 UNPAIDS",-6647.00
```

---

## Dynamic header mapping

### Header Alias Mapping

Defined in `src/utils/constants.ts` as `HEADER_ALIASES`.

The importer resolves **canonical internal fields**. No transformation logic depends on column position, exact CSV layout, or file version.

#### Amount (`amount`)

- `Amount`
- `Transaction Amount`

#### Beneficiary (`beneficiary`)

- `Beneficiary/ Remitter`
- `Beneficiary/ Remitter Name`

#### Customer Reference (`customerReference`)

- `Customer Reference`
- `Customer Reference Number`

#### Transaction Description (`description`)

- `Description`
- `Transaction Description`

#### Payment Details (`paymentDetails`)

- `Payment Details`

#### Type (`transactionType`)

- `Type`
- `Product Type`

#### Narrative (`narrative`)

- `Narrative`

#### Statement Date (`statementDate`)

- `Statement Date`

#### Value Date (`valueDate`)

- `Value Date`

#### Account Number (`accountNumber`)

- `Account Number`

#### Account Name (`accountName`)

- `Account Name`

#### Bank Reference (`bankReference`)

- `Bank Reference`

Headers are normalized (trim + strip surrounding quotes) before matching. When multiple aliases match, the first listed alias wins.

### Column-order independence

- Column order is irrelevant
- Extra columns are ignored and do not fail import
- Unused columns may disappear without breaking import
- Future CitiBank columns should not break imports unless a required business field is renamed without an alias

### Fields used vs ignored

**Used for transformation / validation**

| Canonical field | Role |
| --- | --- |
| `statementDate` / `valueDate` | Output date (Statement Date first for new format) |
| `amount` | Amount + credit/debit sign |
| `paymentDetails` | Credit description (primary) |
| `beneficiary` | Debit description (primary when populated) |
| `description` | Debit description rules / fallback |
| `narrative` | Required for certain debit description rules |
| `customerReference` | Legacy description; compatibility fallbacks |
| `accountNumber` | Legacy row validation only |

**Mapped but not used for Sage output rules**

- `transactionType` (`Type` / `Product Type`)
- `bankReference`
- `accountName`

**Ignored when present**

- `Currency`
- Any column not listed in `HEADER_ALIASES`

---

## Format detection

The importer does **not** detect formats by a fixed full header layout.

It scans line by line until a header row contains enough **required business fields** (via aliases):

| Detected format | Required logical fields |
| --- | --- |
| **New / latest** (checked first) | `amount`, `customerReference`, `description`, and at least one of `valueDate` or `statementDate` |
| **Legacy** (fallback) | `accountNumber`, `valueDate`, `customerReference`, `amount` |

`Payment Details` is **not** required for format recognition, so older new-format files without that column still match.

The converter continues to work if CitiBank:

- reorders columns
- inserts extra columns
- removes unused columns

---

## Date logic

- **Legacy:** use `Value Date`
- **New / latest:** use `Statement Date` first; if empty, use `Value Date`
- Output formatting follows Settings: `DD/MM/YYYY` (default) or `MM/DD/YYYY`
- Accepted input dates: `M/D/YYYY` or `MM/DD/YYYY`

---

## Description selection hierarchy

All description selection lives in **`getOutputDescription()`** in `src/utils/csvTransformer.ts`.

Exact Transaction Description match strings are defined in `DESCRIPTION_RULES` in `constants.ts`.

### Legacy format

Output Description = `Customer Reference`

### Credits (Transaction Amount ≥ 0)

1. **Payment Details** (primary — latest exports)
2. If Payment Details is blank and Transaction Description = `TARGET BALANCING SWEEP (EOD)` → **Narrative** (when present)
3. Compatibility fallbacks for older new-format files without Payment Details:
   - If Customer Reference = `820 0201523001` → Transaction Description
   - Else Customer Reference
   - Else Transaction Description

#### Credit examples

| Payment Details | Output Description |
| --- | --- |
| `TRSS24 HOUR REACTION` | `TRSS24 HOUR REACTION` |
| `ABSA BANK FOX050` | `ABSA BANK FOX050` |

### Debits (Transaction Amount &lt; 0)

Processing order:

1. **Beneficiary / Remitter Name** — if populated, use it  
   Example: `MTN - APN SERVER` → `MTN - APN SERVER`

2. If Transaction Description = **`INCOMING DIRECT DEBIT`**  
   → **Narrative**  
   Examples: `THE150 UNPAIDS`, `SPE110 UNPAIDS`  
   *(Also accepts legacy wording `EFT DIRECT DEBIT RETURNED` → Narrative)*

3. If Transaction Description = **`MONTHLY CASH BILLING INVOICE PAID`**  
   → **Transaction Description**  
   Output: `MONTHLY CASH BILLING INVOICE PAID`

4. If Transaction Description = **`TARGET BALANCING SWEEP (EOD)`**  
   → **Narrative** (preferred)  
   Example: Narrative `820 0201523001` → `820 0201523001`  
   If Narrative is blank (older files), falls back to Transaction Description

5. **Fallback** → Transaction Description

### TARGET BALANCING SWEEP handling

- **Debit:** Narrative when available (latest), else Transaction Description (older files)
- **Credit with blank Payment Details:** Narrative when available

### INCOMING DIRECT DEBIT handling

Debit + blank Beneficiary + Description = `INCOMING DIRECT DEBIT` → Narrative required.

### MONTHLY CASH BILLING INVOICE PAID handling

Debit + blank Beneficiary + that Description → output the Description text itself (Narrative not required).

### Legacy debit-order rejection

Debit + Description = `EFT DIRECT DEBIT RETURNED` → Narrative (unchanged behaviour).

---

## Amount transformation

Unchanged:

- removes quotes, apostrophes, and spaces
- removes thousands-separator commas
- preserves sign and decimal precision by default
- Settings may `round` or `truncate` to integers

Examples:

- `"1,750,000.00"` → `1750000.00`
- `"'-107,042.59"` → `-107042.59`
- `" -88,433.98"` → `-88433.98`

---

## Validation rules

### File-level

- Extension `.csv` only
- Size up to 10 MB
- Non-empty content
- Supported header row (required business fields)
- At least one non-metadata data row

### Row-level (new / latest)

Reported with **row numbers**:

- Missing Transaction Amount
- Missing date fields (Statement Date or Value Date)
- Invalid date / amount formats
- Missing Customer Reference
- Missing Payment Details for credits (when Payment Details column exists and no description can be resolved)
- Missing Narrative when Narrative is required (`INCOMING DIRECT DEBIT`, legacy `EFT DIRECT DEBIT RETURNED`, and TARGET BALANCING debits on Payment Details exports)
- Missing Transaction Description when needed for debit resolution
- Unsupported formats (structure-level)

### Structured error shape

```ts
{
  row: number;    // 0 = file/structure level
  field: string;
  value: string;
  message: string;
}
```

### Success criteria

- Invalid rows are skipped (unless Settings error handling is `stop`)
- Success requires at least one output row **and** ≥ 50% success rate of processable rows
- If structure is OK but every row fails:  
  `No valid transactions found. The file structure was detected successfully but all transaction rows failed validation.`

---

## Error handling

- Processing always completes with success or failure (loading state cleared in `finally`)
- The UI never stays stuck on “Processing your CSV file…”
- Unsupported formats list detected vs missing business fields
- Row errors include the row number and the specific field issue

Example unsupported-format message:

```text
Unsupported CitiBank format.

Detected:
- Transaction Amount
- Payment Details

Missing:
- Description
- Value Date
```

---

## CSV normalization and robustness

Custom CSV parsing handles:

- Quoted headers and values
- Leading/trailing whitespace
- Varying column order
- Optional / unused columns
- Header aliases for renamed fields

---

## User flow

### Converter tab

1. Upload a CSV file
2. Client-side file checks (extension / size)
3. Process through parsing → finding → transforming → generating
4. On success: preview first 5 rows, then download
5. On failure: show structured errors; retry with another file

### Settings tab

`localStorage`-backed settings:

- date format preference
- amount rounding preference
- error handling preference (`skip` / `stop`)
- filename template
- auto-download toggle
- theme preference
- advanced stats toggle
- export/import/reset of saved settings

### History tab

Stores processing-session **metadata** only (not raw uploads or generated CSV bytes):

- original and generated filenames
- input/output sizes
- processing duration
- processed/error row counts
- settings snapshot

## Important current limitations

- Live converter processes one file at a time
- History does not persist uploaded files or generated CSV contents (no re-download from History)
- Prototype components under `src/components/advanced/`, `BasicProcessor.tsx`, `EnhancedProcessor.tsx`, and `v0.dev_files/` are not the mounted production path
- `papaparse` is installed but unused by the live pipeline
- Some older TypeScript interfaces still name classic column labels; runtime mapping uses `HEADER_ALIASES` → `NormalizedCitiBankRow`

## Tech stack

- React 19
- TypeScript 5
- Vite 7
- Tailwind CSS 3
- Radix UI / shadcn-style components
- `next-themes`
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
│   │   ├── csvTransformer.ts        # Parsing, getOutputDescription(), output
│   │   ├── fileValidator.ts         # Validation, aliases, format detection
│   │   ├── constants.ts             # HEADER_ALIASES, DESCRIPTION_RULES, errors
│   │   └── localStorage.ts
│   ├── types/
│   │   └── index.ts
│   ├── components/
│   └── lib/
├── public/
│   └── samples/                     # Sample CSVs including NEW_Transaction_citibank.csv
├── .github/workflows/deploy.yml
├── netlify.toml
├── vite.config.ts
├── tailwind.config.js
├── eslint.config.js
├── test_decimal_fix.js
└── v0.dev_files/
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

Vite dev server: port `3000`.

### Build and preview

```bash
npm run build
npm run preview
```

Preview server: port `4173`.

## Available scripts

- `npm run dev` — Vite development server
- `npm run build` — production bundle
- `npm run build:check` — TypeScript build config, then build
- `npm run lint` — ESLint
- `npm run preview` — preview built app
- `npm run build:netlify` — clean install and build
- `npm run deploy` — build and publish `dist/` with `gh-pages`

## Deployment

### GitHub Pages

`.github/workflows/deploy.yml` runs on pushes/PRs to `main`, builds, and deploys `dist/`.

### Netlify

`netlify.toml`: build `npm run build`, publish `dist`, SPA redirect, security/cache headers.

See `NETLIFY_DEPLOYMENT.md` for additional notes.

## Sample data

Under `public/samples/`:

- `NEW_Transaction_citibank.csv` — latest export with Payment Details, INCOMING DIRECT DEBIT, TARGET BALANCING SWEEP, etc.
- `LATEST_sample_citibank_export.csv` — renamed-column export without Payment Details
- `NEW_sample_citibank_export.csv` / `OLD/` — older debit-order rejection and classic samples

## Testing

No formal unit/e2e suite is configured in `package.json`.

Manual decimal check:

```bash
node test_decimal_fix.js
```

After import/description changes, manually verify:

1. `NEW_Transaction_citibank.csv`
2. Renamed-column / older new-format samples
3. Legacy exports (if available)
4. Sage columns remain exactly `Date,Description,Amount`

## Notes for maintainers

- `HEADER_ALIASES` is the control point for CitiBank column renames — add aliases, do not hardcode layouts
- `DESCRIPTION_RULES` is the control point for exact Transaction Description match text
- `getOutputDescription()` is the only place description business rules should live
- `LEGACY_REQUIRED_HEADERS` / `NEW_REQUIRED_HEADERS` are deprecated reference lists; live detection uses logical fields
- `FILE_CONSTRAINTS.requiredHeaders` is historical; live detection does not use it

### Future maintenance guidance

1. New column rename → add alias under the matching logical field in `HEADER_ALIASES`
2. Brand-new unused column → no code change (ignored)
3. New credit/debit description rule → extend `getOutputDescription()` and `DESCRIPTION_RULES`, update this README
4. Do **not** change Sage output columns unless product owners explicitly request it
5. Keep exact-text matches (`INCOMING DIRECT DEBIT`, `TARGET BALANCING SWEEP (EOD)`, etc.) in sync with CitiBank wording
6. Prefer rule-driven resolution over format-specific forks so future export changes need minimal maintenance
