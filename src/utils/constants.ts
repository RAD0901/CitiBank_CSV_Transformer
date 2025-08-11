import type { FileConstraints } from '../types';

export const FILE_CONSTRAINTS: FileConstraints = {
  maxSizeMB: 10,
  allowedExtensions: ['.csv'],
  requiredHeaders: ['Account Number', 'Value Date', 'Customer Reference', 'Amount']
};

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
  MISSING_HEADERS: 'CSV file must contain required headers: Account Number, Value Date, Customer Reference, Amount',
  NO_DATA_ROWS: 'CSV file contains no transaction data',
  INVALID_DATE_FORMAT: 'Date must be in MM/DD/YYYY format',
  INVALID_AMOUNT_FORMAT: 'Amount must be a valid number',
  MISSING_REQUIRED_FIELD: 'Required field is missing or empty',
  MALFORMED_CSV: 'CSV file is malformed or corrupted'
} as const;

export const SUCCESS_MESSAGES = {
  FILE_UPLOADED: 'File uploaded successfully',
  PROCESSING_COMPLETE: 'Processing completed successfully',
  VALIDATION_PASSED: 'File validation passed'
} as const;

export const DATE_FORMATS = {
  INPUT_FORMAT: /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/,
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
