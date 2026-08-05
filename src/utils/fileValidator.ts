import type { CitiBankImportFormat, ValidationError, ValidationResult } from '../types';
import {
  FILE_CONSTRAINTS,
  ERROR_MESSAGES,
  METADATA_INDICATORS,
  HEADER_ALIASES,
  LEGACY_REQUIRED_FIELDS,
  NEW_REQUIRED_FIELDS,
  LOGICAL_FIELD_LABELS,
  DATE_FORMATS,
  type LogicalHeaderField
} from './constants';

/**
 * Strips surrounding quotes and whitespace from a CSV header cell.
 */
export function normalizeHeader(header: string): string {
  return header
    .trim()
    .replace(/^["']+|["']+$/g, '')
    .trim();
}

/**
 * Builds a map from logical field → column index using header aliases.
 * Unknown / unused columns are ignored.
 */
export function buildLogicalFieldMap(
  headers: string[]
): Partial<Record<LogicalHeaderField, number>> {
  const normalizedHeaders = headers.map(normalizeHeader);
  const map: Partial<Record<LogicalHeaderField, number>> = {};

  (Object.keys(HEADER_ALIASES) as LogicalHeaderField[]).forEach((field) => {
    const aliases = HEADER_ALIASES[field];
    for (const alias of aliases) {
      const index = normalizedHeaders.findIndex(
        (header) => header === normalizeHeader(alias)
      );
      if (index !== -1) {
        map[field] = index;
        break;
      }
    }
  });

  return map;
}

/**
 * Returns which logical fields are present given raw header cells.
 */
export function resolvePresentFields(
  headers: string[]
): Set<LogicalHeaderField> {
  return new Set(
    Object.keys(buildLogicalFieldMap(headers)) as LogicalHeaderField[]
  );
}

function hasField(
  present: Set<LogicalHeaderField>,
  field: LogicalHeaderField
): boolean {
  return present.has(field);
}

function hasNewFormatDate(present: Set<LogicalHeaderField>): boolean {
  return hasField(present, 'valueDate') || hasField(present, 'statementDate');
}

function matchesLegacyFields(present: Set<LogicalHeaderField>): boolean {
  return LEGACY_REQUIRED_FIELDS.every((field) => hasField(present, field));
}

function matchesNewFields(present: Set<LogicalHeaderField>): boolean {
  return (
    NEW_REQUIRED_FIELDS.every((field) => hasField(present, field)) &&
    hasNewFormatDate(present)
  );
}

function missingLegacyFields(present: Set<LogicalHeaderField>): LogicalHeaderField[] {
  return LEGACY_REQUIRED_FIELDS.filter((field) => !hasField(present, field));
}

function missingNewFields(present: Set<LogicalHeaderField>): LogicalHeaderField[] {
  const missing = NEW_REQUIRED_FIELDS.filter((field) => !hasField(present, field));
  if (!hasNewFormatDate(present)) {
    missing.push('valueDate');
  }
  return missing;
}

/**
 * Builds a user-facing message describing an unsupported header layout.
 */
export function formatUnsupportedFormatMessage(headers: string[]): string {
  const present = resolvePresentFields(headers);
  const detectedLabels = [...present].map((field) => LOGICAL_FIELD_LABELS[field]);
  const rawHeaders = headers.map(normalizeHeader).filter(Boolean);

  // Prefer showing raw headers that we recognized OR all non-empty headers
  const detectedLines =
    detectedLabels.length > 0
      ? detectedLabels
      : rawHeaders.slice(0, 12);

  const legacyMissing = missingLegacyFields(present).map(
    (field) => LOGICAL_FIELD_LABELS[field]
  );
  const newMissing = missingNewFields(present).map(
    (field) => LOGICAL_FIELD_LABELS[field]
  );

  // Report the shorter missing set so the message stays actionable
  const missingLines =
    newMissing.length <= legacyMissing.length ? newMissing : legacyMissing;

  const lines = [
    'Unsupported CitiBank format.',
    '',
    'Detected:',
    ...(detectedLines.length > 0
      ? detectedLines.map((label) => `- ${label}`)
      : ['- (no recognized columns)']),
    '',
    'Missing:',
    ...(missingLines.length > 0
      ? missingLines.map((label) => `- ${label}`)
      : ['- required business fields for conversion'])
  ];

  return lines.join('\n');
}

/**
 * Validates uploaded file for basic requirements
 */
export function validateFile(file: File): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file extension
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!FILE_CONSTRAINTS.allowedExtensions.includes(fileExtension)) {
    errors.push(ERROR_MESSAGES.INVALID_FILE_TYPE);
  }

  // Check file size
  const maxSizeBytes = FILE_CONSTRAINTS.maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    errors.push(ERROR_MESSAGES.FILE_TOO_LARGE);
  }

  // Check if file is empty
  if (file.size === 0) {
    errors.push(ERROR_MESSAGES.FILE_EMPTY);
  }

  // Warning for very small files
  if (file.size < 100) {
    warnings.push('File appears to be very small. Please ensure it contains transaction data.');
  }

  // Warning for very large files
  if (file.size > 5 * 1024 * 1024) { // 5MB
    warnings.push('Large file detected. Processing may take longer than usual.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates CSV file structure and content
 */
export function validateCSVStructure(csvContent: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const structuredErrors: ValidationError[] = [];

  if (!csvContent || csvContent.trim().length === 0) {
    const message = ERROR_MESSAGES.FILE_EMPTY;
    errors.push(message);
    structuredErrors.push({
      row: 0,
      field: 'file',
      value: '',
      message
    });
    return { isValid: false, errors, warnings, structuredErrors };
  }

  try {
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      const message = ERROR_MESSAGES.FILE_EMPTY;
      errors.push(message);
      structuredErrors.push({
        row: 0,
        field: 'file',
        value: '',
        message
      });
      return { isValid: false, errors, warnings, structuredErrors };
    }

    // Find header row via required business fields (alias-aware)
    const headerInfo = findHeaderRow(lines);
    const headerRowIndex = headerInfo.index;
    if (headerRowIndex === -1) {
      // Scan for the most header-like row to report detected columns
      const candidateHeaders = findBestHeaderCandidate(lines);
      const message = formatUnsupportedFormatMessage(candidateHeaders);
      errors.push(message);
      structuredErrors.push({
        row: 0,
        field: 'structure',
        value: candidateHeaders.join(', '),
        message
      });
      return { isValid: false, errors, warnings, structuredErrors };
    }

    // Check for data rows (extra columns are intentionally ignored)
    const dataRows = lines.slice(headerRowIndex + 1).filter(line => 
      line.trim() && !isMetadataRow(line)
    );

    if (dataRows.length === 0) {
      const message = ERROR_MESSAGES.NO_DATA_ROWS;
      errors.push(message);
      structuredErrors.push({
        row: 0,
        field: 'data',
        value: '',
        message
      });
    }

    // Warnings for data quality
    if (dataRows.length > 0 && dataRows.length < 5) {
      warnings.push('Very few transaction rows found. Please verify this is a complete export.');
    }

    if (headerRowIndex > 10 && headerInfo.format === 'legacy') {
      warnings.push('Many metadata rows detected. File structure may be unusual.');
    }

  } catch (error) {
    console.error('CSV structure validation failed:', error);
    const message = ERROR_MESSAGES.MALFORMED_CSV;
    errors.push(message);
    structuredErrors.push({
      row: 0,
      field: 'structure',
      value: '',
      message
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    structuredErrors
  };
}

/**
 * Checks if file size is within limits
 */
export function checkFileSize(file: File): boolean {
  const maxSizeBytes = FILE_CONSTRAINTS.maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes && file.size > 0;
}

/**
 * Checks if file type is allowed
 */
export function checkFileType(file: File): boolean {
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  return FILE_CONSTRAINTS.allowedExtensions.includes(fileExtension);
}

/**
 * Finds the header row containing required business fields
 */
function findHeaderRow(lines: string[]): { index: number; format: CitiBankImportFormat | null; headers: string[] } {
  for (let i = 0; i < lines.length; i++) {
    const headers = parseCSVRow(lines[i]).map(normalizeHeader);
    const format = detectCSVFormat(headers);
    if (format) {
      return { index: i, format, headers };
    }
  }
  return { index: -1, format: null, headers: [] };
}

/**
 * Picks the row that looks most like a header for error reporting.
 */
function findBestHeaderCandidate(lines: string[]): string[] {
  let best: string[] = [];
  let bestScore = -1;

  for (const line of lines.slice(0, 30)) {
    if (isMetadataRow(line)) continue;
    const headers = parseCSVRow(line).map(normalizeHeader).filter(Boolean);
    if (headers.length < 2) continue;

    const present = resolvePresentFields(headers);
    const score = present.size * 10 + headers.length;
    if (score > bestScore) {
      bestScore = score;
      best = headers;
    }
  }

  return best;
}

/**
 * Checks if a line is metadata (not transaction data)
 */
function isMetadataRow(line: string): boolean {
  const trimmedLine = line.trim();
  return METADATA_INDICATORS.some(indicator => 
    trimmedLine.startsWith(indicator) || trimmedLine === '""' || trimmedLine === ''
  );
}

/**
 * Parses a CSV row into individual fields
 */
function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Validates individual field values.
 * Returns plain error messages (row context is added by callers when needed).
 */
export function validateFieldValue(field: string, value: string, rowNumber: number): string[] {
  const errors: string[] = [];

  switch (field) {
    case 'Value Date':
    case 'Statement Date':
      if (!value || !isValidDate(value)) {
        errors.push(
          value
            ? `Row ${rowNumber}: Invalid date:\n${value}`
            : `Row ${rowNumber}: ${ERROR_MESSAGES.INVALID_DATE_FORMAT}`
        );
      }
      break;
    
    case 'Amount':
      if (!value || !isValidAmount(value)) {
        errors.push(
          value
            ? `Row ${rowNumber}:\n\nInvalid amount:\n${value}`
            : `Row ${rowNumber}: ${ERROR_MESSAGES.INVALID_AMOUNT_FORMAT}`
        );
      }
      break;
    
    case 'Customer Reference':
      if (!value || value.trim().length === 0) {
        errors.push(`Row ${rowNumber}: Customer Reference is required`);
      }
      break;
    
    case 'Account Number':
      if (!value || value.trim().length === 0) {
        errors.push(`Row ${rowNumber}: Account Number is required`);
      }
      break;
  }

  return errors;
}

/**
 * Validates date format (MM/DD/YYYY)
 */
function isValidDate(dateStr: string): boolean {
  if (!DATE_FORMATS.INPUT_FORMAT.test(dateStr.trim())) {
    return false;
  }

  // Additional validation for actual date validity
  const [month, day, year] = dateStr.trim().split('/').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && 
         date.getMonth() === month - 1 && 
         date.getDate() === day;
}

/**
 * Validates amount format
 */
function isValidAmount(amountStr: string): boolean {
  // Remove quotes, spaces, and commas for validation
  const cleaned = amountStr.replace(/["',\s]/g, '');
  return !isNaN(parseFloat(cleaned)) && isFinite(parseFloat(cleaned));
}

/**
 * Detects CitiBank export format by required business fields (alias-aware).
 * Extra columns do not affect recognition.
 *
 * Prefers 'new' when description is present (covers renamed latest exports).
 * Falls back to 'legacy' when account number + classic fields are present.
 */
export function detectCSVFormat(headers: string[]): CitiBankImportFormat | null {
  const present = resolvePresentFields(headers);

  // Newer / latest formats are identified by description + amount + customer ref + a date
  if (matchesNewFields(present)) {
    return 'new';
  }

  // Legacy exports include Account Number and lack a Description column
  if (matchesLegacyFields(present)) {
    return 'legacy';
  }

  return null;
}

export function findCSVHeader(lines: string[]): { index: number; format: CitiBankImportFormat | null; headers: string[] } {
  return findHeaderRow(lines);
}
