import type { FileConstraints } from '../types';

export const FILE_CONSTRAINTS: FileConstraints = {
  maxSizeMB: 10,
  allowedExtensions: ['.csv'],
  requiredHeaders: ['Account Number', 'Value Date', 'Customer Reference', 'Amount']
};

/**
 * Logical fields used by the transformer, with accepted CitiBank header aliases.
 * Extra columns not listed here are ignored during import.
 */
export const HEADER_ALIASES = {
  amount: ['Amount', 'Transaction Amount'],
  beneficiary: ['Beneficiary/ Remitter', 'Beneficiary/ Remitter Name'],
  customerReference: ['Customer Reference', 'Customer Reference Number'],
  description: ['Description', 'Transaction Description'],
  transactionType: ['Type', 'Product Type'],
  narrative: ['Narrative'],
  statementDate: ['Statement Date'],
  valueDate: ['Value Date'],
  accountNumber: ['Account Number'],
  bankReference: ['Bank Reference']
} as const;

export type LogicalHeaderField = keyof typeof HEADER_ALIASES;

/** @deprecated Prefer HEADER_ALIASES / field-based detection. Kept for reference. */
export const LEGACY_REQUIRED_HEADERS = [
  'Account Number',
  'Value Date',
  'Customer Reference',
  'Amount'
] as const;

/** @deprecated Prefer HEADER_ALIASES / field-based detection. Kept for reference. */
export const NEW_REQUIRED_HEADERS = [
  'Value Date',
  'Statement Date',
  'Amount',
  'Beneficiary/ Remitter',
  'Customer Reference',
  'Description'
] as const;

/** Logical fields required to recognize a legacy CitiBank export. */
export const LEGACY_REQUIRED_FIELDS: readonly LogicalHeaderField[] = [
  'accountNumber',
  'valueDate',
  'customerReference',
  'amount'
];

/**
 * Logical fields required to recognize a newer / latest CitiBank export.
 * Date may be Value Date and/or Statement Date (checked separately).
 */
export const NEW_REQUIRED_FIELDS: readonly LogicalHeaderField[] = [
  'amount',
  'customerReference',
  'description'
];

export const PROCESSING_STEPS = {
  PARSING: 'Parsing CSV file...',
  FINDING: 'Finding transaction data...',
  TRANSFORMING: 'Transforming records...',
  GENERATING: 'Generating output file...'
} as const;

export const ERROR_MESSAGES = {
  INVALID_FILE_TYPE: 'File must be a CSV file with .csv extension',
  FILE_TOO_LARGE: `File size must be less than ${FILE_CONSTRAINTS.maxSizeMB}MB`,
  FILE_EMPTY: 'File is empty',
  MISSING_HEADERS: 'Unsupported CitiBank format. The file does not contain the required business fields.',
  NO_DATA_ROWS: 'CSV file contains no transaction data',
  NO_VALID_TRANSACTIONS:
    'No valid transactions found. The file structure was detected successfully but all transaction rows failed validation.',
  INVALID_DATE_FORMAT: 'Date must be in M/D/YYYY or MM/DD/YYYY format',
  INVALID_AMOUNT_FORMAT: 'Amount must be a valid number',
  MISSING_REQUIRED_FIELD: 'Required field is missing or empty',
  MALFORMED_CSV: 'CSV file is malformed or corrupted',
  DEBIT_ORDER_MISSING_NARRATIVE: 'Debit order rejection row missing Narrative.',
  PROCESSING_FAILED: 'There was an error processing your CSV file.'
} as const;

export const SUCCESS_MESSAGES = {
  FILE_UPLOADED: 'File uploaded successfully',
  PROCESSING_COMPLETE: 'Processing completed successfully',
  VALIDATION_PASSED: 'File validation passed'
} as const;

export const DATE_FORMATS = {
  INPUT_FORMAT: /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])\/\d{4}$/,
  OUTPUT_FORMAT: 'DD/MM/YYYY'
} as const;

export const AMOUNT_PATTERNS = {
  CLEANUP_REGEX: /["',\s]/g,
  VALIDATION_REGEX: /^-?\d+(\.\d{1,2})?$/
} as const;

export const METADATA_INDICATORS = [
  'Search Criteria:',
  'From Date:',
  'To Date:',
  'Accounts:',
  '""'
] as const;

export const PROGRESS_THRESHOLDS = {
  PARSING: 25,
  FINDING: 50,
  TRANSFORMING: 75,
  GENERATING: 100
} as const;

/** Human-readable labels for logical fields (used in error messages). */
export const LOGICAL_FIELD_LABELS: Record<LogicalHeaderField, string> = {
  amount: 'Amount',
  beneficiary: 'Beneficiary/ Remitter',
  customerReference: 'Customer Reference',
  description: 'Description',
  transactionType: 'Type',
  narrative: 'Narrative',
  statementDate: 'Statement Date',
  valueDate: 'Value Date',
  accountNumber: 'Account Number',
  bankReference: 'Bank Reference'
};
