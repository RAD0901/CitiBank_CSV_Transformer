# Core Transformation Summary

This file summarizes the current conversion logic at a high level. For the detailed, maintained behavior description, use `README.md`.

## Current processing pipeline

The live converter path is:

`src/App.tsx` → `src/hooks/useCSVProcessor.tsx` → `src/utils/fileValidator.ts` + `src/utils/csvTransformer.ts`

## Current transformation rules

- Legacy CitiBank rows keep `Customer Reference` as the Sage `Description`
- New-format negative rows use `Beneficiary/ Remitter`, falling back to `Description`
- New-format debit order rejections use `Narrative` when:
  - the amount is negative, and
  - `Description` is exactly `EFT DIRECT DEBIT RETURNED`
- New-format positive rows use `Customer Reference`
- Internal-reference receipts where `Customer Reference = 820 0201523001` use `Description`

## Current configurable behavior

The mounted app now applies saved settings for:

- output date format: `DD/MM/YYYY` or `MM/DD/YYYY`
- amount handling: `preserve`, `round`, or `truncate`
- error handling: `skip` or `stop`
- filename template generation
- optional auto-download
- theme preference

## Current validation behavior

- file type: `.csv` only
- file size: max 10 MB
- supported legacy or new header detection
- row-level date and amount validation
- required description-source validation

## Current history behavior

The main app now records processing-session metadata to `localStorage`, including:

- input/output filenames
- input/output sizes
- processing duration
- processed/error row counts
- the settings snapshot used for that run

Generated CSV contents and uploaded files are not stored.
