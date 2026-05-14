<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# CitiBank CSV Transformer Project Instructions

This is a React TypeScript application for converting CitiBank CSV exports to Sage Bank Manager format.

## Project Context
- **Framework**: React 19 with TypeScript and Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **CSV Processing**: custom client-side parsing and transformation in `src/utils/csvTransformer.ts`
- **State Management**: React hooks (useState, useCallback)
- **File Operations**: Browser File API for upload/download

## Code Style Guidelines
- Use TypeScript with strict type checking
- Follow React functional component patterns with hooks
- Use Tailwind CSS classes for styling
- Implement proper error handling for file operations
- Use semantic HTML and accessibility best practices

## Key Features to Maintain
- File upload via drag & drop or file browser
- Real-time processing progress indicators
- Data validation and error handling
- CSV transformation from CitiBank to Sage format
- File download functionality

## Data Transformation Rules
1. Skip metadata rows (first 5 lines)
2. Convert dates to the configured output format (`DD/MM/YYYY` or `MM/DD/YYYY`)
3. Clean amounts: remove quotes, commas, apostrophes, and spaces while preserving decimal precision by default
4. Legacy rows use `Customer Reference` as Description
5. New-format debit order rejection rows use `Narrative` when the amount is negative and `Description` is exactly `EFT DIRECT DEBIT RETURNED`
6. Other new-format negative rows use `Beneficiary/ Remitter`, falling back to `Description`
7. New-format positive rows use `Customer Reference`, except internal-reference receipts where `Customer Reference = 820 0201523001`, which use `Description`
8. Saved settings and processing history are live parts of the mounted `App.tsx` flow

## Component Architecture
- Main App component handles state management
- Utility functions in `/utils/csvTransformer.ts`
- Type definitions in `/types/index.ts`
- Tailwind CSS with custom variables for theming

## Development Notes
- All processing happens client-side for security
- No backend required - deployable as static site
- GitHub Pages deployment ready
- Mobile-responsive design required
