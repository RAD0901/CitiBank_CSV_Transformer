# Download Behavior Notes

This note replaces the older bug-fix snapshot.

## Current behavior

The mounted app uses a single `DownloadButton` in `src/App.tsx` to download the generated Sage Bank Manager CSV.

Current download behavior:

- manual download is available after successful processing
- filenames follow the active Settings filename template
- auto-download can be enabled from Settings
- the downloaded file still contains the same three output columns:
  - `Date`
  - `Description`
  - `Amount`

## Current implementation path

- UI button: `src/components/download-button.tsx`
- click handling: `src/App.tsx`
- CSV generation: `src/utils/csvTransformer.ts`

## Notes

- generated CSV contents are downloaded directly in the browser
- generated CSV contents are not persisted to History
- History stores metadata only, so re-download from the History tab is not currently available
