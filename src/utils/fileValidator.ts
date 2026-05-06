import type { CitiBankImportFormat, ValidationResult } from '../types';
import {
  FILE_CONSTRAINTS,
  ERROR_MESSAGES,
  METADATA_INDICATORS,
  LEGACY_REQUIRED_HEADERS,
  NEW_REQUIRED_HEADERS,
  DATE_FORMATS
} from './constants';

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

  if (!csvContent || csvContent.trim().length === 0) {
    errors.push(ERROR_MESSAGES.FILE_EMPTY);
    return { isValid: false, errors, warnings };
  }

  try {
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      errors.push(ERROR_MESSAGES.FILE_EMPTY);
      return { isValid: false, errors, warnings };
    }

    // Find header row
    const headerInfo = findHeaderRow(lines);
    const headerRowIndex = headerInfo.index;
    if (headerRowIndex === -1) {
      errors.push(ERROR_MESSAGES.MISSING_HEADERS);
      return { isValid: false, errors, warnings };
    }

    // Validate headers
    const headers = headerInfo.headers;
    const requiredHeaders = headerInfo.format === 'new' ? NEW_REQUIRED_HEADERS : LEGACY_REQUIRED_HEADERS;
    const missingHeaders = requiredHeaders.filter(
      required => !headers.some(header => header === required)
    );

    if (missingHeaders.length > 0) {
      errors.push(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    // Check for data rows
    const dataRows = lines.slice(headerRowIndex + 1).filter(line => 
      line.trim() && !isMetadataRow(line)
    );

    if (dataRows.length === 0) {
      errors.push(ERROR_MESSAGES.NO_DATA_ROWS);
    }

    // Warnings for data quality
    if (dataRows.length < 5) {
      warnings.push('Very few transaction rows found. Please verify this is a complete export.');
    }

    if (headerRowIndex > 10 && headerInfo.format === 'legacy') {
      warnings.push('Many metadata rows detected. File structure may be unusual.');
    }

  } catch {
    errors.push(ERROR_MESSAGES.MALFORMED_CSV);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
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
 * Finds the header row containing account information
 */
function findHeaderRow(lines: string[]): { index: number; format: CitiBankImportFormat | null; headers: string[] } {
  for (let i = 0; i < lines.length; i++) {
    const headers = parseCSVRow(lines[i]).map(header => header.trim());
    const format = detectCSVFormat(headers);
    if (format) {
      return { index: i, format, headers };
    }
  }
  return { index: -1, format: null, headers: [] };
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
 * Validates individual field values
 */
export function validateFieldValue(field: string, value: string, rowNumber: number): string[] {
  const errors: string[] = [];

  switch (field) {
    case 'Value Date':
    case 'Statement Date':
      if (!value || !isValidDate(value)) {
        errors.push(`Row ${rowNumber}: ${ERROR_MESSAGES.INVALID_DATE_FORMAT}`);
      }
      break;
    
    case 'Amount':
      if (!value || !isValidAmount(value)) {
        errors.push(`Row ${rowNumber}: ${ERROR_MESSAGES.INVALID_AMOUNT_FORMAT}`);
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

export function detectCSVFormat(headers: string[]): CitiBankImportFormat | null {
  const normalizedHeaders = headers.map(header => header.trim());
  const hasLegacyHeaders = LEGACY_REQUIRED_HEADERS.every(required =>
    normalizedHeaders.includes(required)
  );
  if (hasLegacyHeaders) {
    return 'legacy';
  }

  const hasNewHeaders = NEW_REQUIRED_HEADERS.every(required =>
    normalizedHeaders.includes(required)
  );
  if (hasNewHeaders) {
    return 'new';
  }

  return null;
}

export function findCSVHeader(lines: string[]): { index: number; format: CitiBankImportFormat | null; headers: string[] } {
  return findHeaderRow(lines);
}
