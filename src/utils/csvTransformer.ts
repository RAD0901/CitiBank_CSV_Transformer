import type { 
  CitiBankTransaction, 
  SageBankTransaction, 
  ValidationError, 
  ProcessingResult
} from '../types';
import { validateFieldValue } from './fileValidator';
import { ERROR_MESSAGES, DATE_FORMATS } from './constants';

/**
 * Parses CitiBank CSV content and extracts transaction data
 */
export function parseCitiBankCSV(csvContent: string): CitiBankTransaction[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  // Find header row
  const headerRowIndex = findHeaderRow(lines);
  if (headerRowIndex === -1) {
    throw new Error('Could not find header row with required fields');
  }

  // Extract data rows
  const dataRows = lines.slice(headerRowIndex + 1);

  // Transform rows to objects
  const transactions: CitiBankTransaction[] = [];
  
  dataRows.forEach((row) => {
    if (!row.trim() || isMetadataRow(row)) return;
    
    const fields = parseCSVRow(row);
    if (fields.length < 4) return; // Skip incomplete rows
    
    const transaction: CitiBankTransaction = {
      'Account Number': fields[0]?.trim() || '',
      'Value Date': fields[1]?.trim() || '',
      'Customer Reference': fields[2]?.trim() || '',
      'Amount': fields[3]?.trim() || ''
    };

    // Only add if essential fields are present
    if (transaction['Value Date'] && transaction['Amount']) {
      transactions.push(transaction);
    }
  });

  return transactions;
}

/**
 * Transforms date from MM/DD/YYYY to DD/MM/YYYY format
 */
export function transformDate(inputDate: string): string {
  if (!inputDate || !DATE_FORMATS.INPUT_FORMAT.test(inputDate)) {
    throw new Error(`Invalid date format: ${inputDate}. Expected MM/DD/YYYY`);
  }

  const [month, day, year] = inputDate.split('/');
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
}

/**
 * Transforms CitiBank amount format to clean decimal string
 * Input examples: " -1,911,566.02", "1,750,000.00", " 88,433.98"
 * Output examples: "-1911566.02", "1750000.00", "88433.98"
 */
export function transformAmount(inputAmount: string): string {
  if (!inputAmount || typeof inputAmount !== 'string') {
    throw new Error('Invalid amount input');
  }
  
  // Remove quotes and spaces but KEEP the decimal point and digits
  const cleaned = inputAmount.replace(/["'\s]/g, ''); // Remove quotes and spaces only
  
  // Remove commas but preserve decimal point and negative sign
  const withoutCommas = cleaned.replace(/,/g, '');
  
  // Validate it's a valid number format
  const numericValue = parseFloat(withoutCommas);
  if (isNaN(numericValue)) {
    throw new Error(`Invalid numeric amount: ${inputAmount}`);
  }
  
  // Return as string with exact decimal precision preserved
  return withoutCommas;
}

/**
 * Formats amount string for display with proper localization
 */
export function formatAmountForDisplay(amount: string): string {
  const numericValue = parseFloat(amount);
  if (isNaN(numericValue)) {
    return amount; // Return as-is if not a valid number
  }
  
  return numericValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Validates that a transformed amount string represents a valid decimal number
 */
export function validateTransformedAmount(amount: string): boolean {
  const numericValue = parseFloat(amount);
  return !isNaN(numericValue) && isFinite(numericValue);
}

/**
 * Transforms a single CitiBank row to Sage Bank Manager format
 */
export function transformRow(row: CitiBankTransaction): SageBankTransaction {
  return {
    Date: transformDate(row['Value Date']),
    Description: row['Customer Reference'].trim(),
    Amount: transformAmount(row['Amount'])
  };
}

/**
 * Validates a single CitiBank transaction row
 */
export function validateRow(row: CitiBankTransaction, rowNumber: number): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate each field
  Object.entries(row).forEach(([field, value]) => {
    const fieldErrors = validateFieldValue(field, value, rowNumber);
    fieldErrors.forEach(errorMessage => {
      errors.push({
        row: rowNumber,
        field,
        value,
        message: errorMessage
      });
    });
  });

  // Additional business logic validation
  if (row['Customer Reference'].trim().length === 0) {
    errors.push({
      row: rowNumber,
      field: 'Customer Reference',
      value: row['Customer Reference'],
      message: 'Description cannot be empty'
    });
  }

  return errors;
}

/**
 * Processes complete CSV data and returns formatted result
 */
export function processCSVData(csvContent: string): ProcessingResult {
  const result: ProcessingResult = {
    success: false,
    data: [],
    errors: [],
    statistics: {
      totalRows: 0,
      metadataRows: 0,
      processedRows: 0,
      errorRows: 0,
      successRate: 0
    }
  };

  try {
    // Parse the CSV content
    const lines = csvContent.split('\n').filter(line => line.trim());
    result.statistics.totalRows = lines.length;

    // Find header row and count metadata
    const headerRowIndex = findHeaderRow(lines);
    if (headerRowIndex === -1) {
      result.errors.push({
        row: 0,
        field: 'structure',
        value: '',
        message: ERROR_MESSAGES.MISSING_HEADERS
      });
      return result;
    }

    result.statistics.metadataRows = headerRowIndex;

    // Extract transaction data
    const transactions = parseCitiBankCSV(csvContent);
    
    if (transactions.length === 0) {
      result.errors.push({
        row: 0,
        field: 'data',
        value: '',
        message: ERROR_MESSAGES.NO_DATA_ROWS
      });
      return result;
    }

    // Process each transaction
    const transformedData: SageBankTransaction[] = [];
    
    transactions.forEach((transaction, index) => {
      const rowNumber = headerRowIndex + index + 2; // Actual CSV row number
      
      try {
        // Validate the row
        const validationErrors = validateRow(transaction, rowNumber);
        
        if (validationErrors.length > 0) {
          result.errors.push(...validationErrors);
          result.statistics.errorRows++;
          return; // Skip this row
        }

        // Transform the row
        const transformedRow = transformRow(transaction);
        transformedData.push(transformedRow);
        result.statistics.processedRows++;
        
      } catch (error) {
        result.errors.push({
          row: rowNumber,
          field: 'transformation',
          value: JSON.stringify(transaction),
          message: `Transformation error: ${error}`
        });
        result.statistics.errorRows++;
      }
    });

    // Calculate success rate
    const totalProcessableRows = transactions.length;
    result.statistics.successRate = totalProcessableRows > 0 
      ? (result.statistics.processedRows / totalProcessableRows) * 100 
      : 0;

    // Set final result
    result.data = transformedData;
    result.success = transformedData.length > 0 && result.statistics.successRate >= 50;

  } catch (error) {
    result.errors.push({
      row: 0,
      field: 'processing',
      value: '',
      message: `Processing error: ${error}`
    });
  }

  return result;
}

/**
 * Generates CSV content for Sage Bank Manager
 */
export function generateOutputCSV(data: SageBankTransaction[]): string {
  const headers = ['Date', 'Description', 'Amount'];
  const csvRows = [headers.join(',')];
  
  data.forEach(row => {
    const csvRow = [
      row.Date,
      `"${row.Description.replace(/"/g, '""')}"`, // Escape quotes in description
      row.Amount // Amount is already a string with exact decimal precision
    ].join(',');
    csvRows.push(csvRow);
  });
  
  return csvRows.join('\n');
}

/**
 * Downloads CSV content as a file
 */
export function downloadCSV(csvContent: string, filename: string = 'sage_bank_manager_import.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Helper functions

/**
 * Finds the header row containing account information
 */
function findHeaderRow(lines: string[]): number {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('Account Number') && line.includes('Value Date')) {
      return i;
    }
  }
  return -1;
}

/**
 * Checks if a line is metadata (not transaction data)
 */
function isMetadataRow(line: string): boolean {
  const trimmedLine = line.trim();
  const metadataIndicators = ['Search Criteria:', 'From Date:', 'To Date:', 'Accounts:', '""'];
  return metadataIndicators.some(indicator => 
    trimmedLine.startsWith(indicator) || trimmedLine === '""' || trimmedLine === ''
  );
}

/**
 * Parses a CSV row into individual fields, handling quotes
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
