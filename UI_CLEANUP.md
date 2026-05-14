# UI Cleanup Notes

This file is now a short reference note instead of a point-in-time cleanup log.

## Current converter UI

The mounted UI in `src/App.tsx` currently provides:

- one primary upload flow for a single CitiBank CSV
- progress feedback during parsing, finding, transforming, and generating
- a preview of the first 5 converted rows
- one primary download action after successful processing
- a Settings tab for active converter preferences
- a History tab for recorded processing-session metadata

## Current cleanup status

- duplicate download actions are no longer present in the mounted flow
- the download action uses the shared `DownloadButton` component
- settings and history are part of the live app, not just placeholder tabs

## Remaining UI constraints

- the live app is still single-file only
- prototype UI paths still exist outside the mounted converter flow
