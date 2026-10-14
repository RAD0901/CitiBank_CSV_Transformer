import type { 
  CitiBankImportFormat,
  NormalizedCitiBankRow,
  ProcessingOptions,
  SageBankTransaction, 
  ValidationError, 
  ProcessingResult
} from '../types';
import {
  findCSVHeader,
  validateFieldValue,
  buildLogicalFieldMap,
  formatUnsupportedFormatMessage,
  normalizeHeader
} from './fileValidator';
import {
  ERROR_MESSAGES,
  DATE_FORMATS,
  METADATA_INDICATORS,
  DESCRIPTION_RULES,
  type LogicalHeaderField
} from './constants';

/**
 * Parses CitiBank CSV content and extracts transaction data
 */
export function parseCitiBankCSV(csvContent: string): NormalizedCitiBankRow[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  // Find header row
  const { index: headerRowIndex, format, headers } = findCSVHeader(lines);
  if (headerRowIndex === -1) {
    throw new Error(formatUnsupportedFormatMessage(
      lines.length > 0 ? parseCSVRow(lines[0]).map(normalizeHeader) : []
    ));
  }

  // Extract data rows
  const dataRows = lines.slice(headerRowIndex + 1);
  const fieldMap = buildLogicalFieldMap(headers);
  const hasPaymentDetailsColumn = fieldMap.paymentDetails !== undefined;

  // Transform rows to objects
  const transactions: NormalizedCitiBankRow[] = [];
  
  dataRows.forEach((row, dataRowIndex) => {
    if (!row.trim() || isMetadataRow(row)) return;
    
    const fields = parseCSVRow(row);
    const transaction = mapFieldsToNormalized(
      fields,
      fieldMap,
      format as CitiBankImportFormat,
      headerRowIndex + dataRowIndex + 2,
      hasPaymentDetailsColumn
    );

    const hasAmount = Boolean(transaction.amount);
    const hasDate = Boolean(
      transaction.valueDate ||
      (transaction.format === 'new' && transaction.statementDate)
    );

    if (hasAmount && hasDate) {
      if (!transaction.valueDate && transaction.statementDate) {
        transaction.valueDate = transaction.statementDate;
      }
      transactions.push(transaction);
    }
  });

  return transactions;
}

/**
 * Transforms date from MM/DD/YYYY to DD/MM/YYYY format
 */
export function transformDate(
  inputDate: string,
  outputFormat: ProcessingOptions['dateFormat'] = 'DD/MM/YYYY'
): string {
  const trimmedDate = inputDate?.trim();
  if (!trimmedDate || !DATE_FORMATS.INPUT_FORMAT.test(trimmedDate)) {
    throw new Error(`Invalid date format: ${inputDate}. Expected M/D/YYYY or MM/DD/YYYY`);
  }

  const [month, day, year] = trimmedDate.split('/');
  const paddedMonth = month.padStart(2, '0');
  const paddedDay = day.padStart(2, '0');

  if (outputFormat === 'MM/DD/YYYY') {
    return `${paddedMonth}/${paddedDay}/${year}`;
  }

  return `${paddedDay}/${paddedMonth}/${year}`;
}

/**
 * Transforms CitiBank amount format to clean decimal string
 * Input examples: " -1,911,566.02", "1,750,000.00", " 88,433.98"
 * Output examples: "-1911566.02", "1750000.00", "88433.98"
 */
export function transformAmount(
  inputAmount: string,
  roundingMode?: ProcessingOptions['amountRounding']
): string {
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

  if (roundingMode === 'round') {
    return `${Math.round(numericValue)}`;
  }

  if (roundingMode === 'truncate') {
    const truncatedValue = numericValue < 0 ? Math.ceil(numericValue) : Math.floor(numericValue);
    return `${truncatedValue}`;
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
export function transformRow(
  row: NormalizedCitiBankRow,
  options: ProcessingOptions = {}
): SageBankTransaction {
  const description = getOutputDescription(row);
  const sourceDate = row.format === 'new' ? (row.statementDate || row.valueDate) : row.valueDate;

  return {
    Date: transformDate(sourceDate, options.dateFormat),
    Description: description,
    Amount: transformAmount(row.amount, options.amountRounding)
  };
}

/**
 * Centralized Sage output Description resolver.
 *
 * Legacy format:
 *   Customer Reference
 *
 * New / latest format — credits (amount > 0):
 *   1. Payment Details
 *   2. Compatibility fallbacks when Payment Details is blank
 *
 * New / latest format — debits (amount < 0):
 *   1. Beneficiary / Remitter Name
 *   2. INCOMING DIRECT DEBIT (or legacy EFT DIRECT DEBIT RETURNED) → Narrative
 *   3. MONTHLY CASH BILLING INVOICE PAID → Transaction Description
 *   4. TARGET BALANCING SWEEP (EOD) → Narrative (fallback Description for older files)
 *   5. Fallback → Transaction Description
 */
export function getOutputDescription(row: NormalizedCitiBankRow): string {
  if (row.format === 'legacy') {
    return (row.customerReference ?? '').trim();
  }

  const paymentDetails = (row.paymentDetails ?? '').trim();
  const beneficiary = (row.beneficiaryRemitter ?? '').trim();
  const description = (row.description ?? '').trim();
  const narrative = (row.narrative ?? '').trim();
  const customerReference = (row.customerReference ?? '').trim();

  if (!isPaymentRow(row.amount)) {
    // CREDITS (positive / zero)
    if (paymentDetails) {
      return paymentDetails;
    }

    // TARGET BALANCING credits often have blank Payment Details; use Narrative.
    if (description === DESCRIPTION_RULES.TARGET_BALANCING_SWEEP && narrative) {
      return narrative;
    }

    // Older new-format files without Payment Details column
    if (customerReference === DESCRIPTION_RULES.INTERNAL_CUSTOMER_REFERENCE) {
      return description;
    }
    if (customerReference) {
      return customerReference;
    }
    return description;
  }

  // DEBITS (negative)
  if (beneficiary) {
    return beneficiary;
  }

  if (
    description === DESCRIPTION_RULES.INCOMING_DIRECT_DEBIT ||
    description === DESCRIPTION_RULES.EFT_DIRECT_DEBIT_RETURNED
  ) {
    return narrative;
  }

  if (description === DESCRIPTION_RULES.MONTHLY_CASH_BILLING) {
    return description;
  }

  if (description === DESCRIPTION_RULES.TARGET_BALANCING_SWEEP) {
    // Prefer Narrative (latest exports); fall back to Description for older files
    return narrative || description;
  }

  return description;
}

/**
 * Validates a single CitiBank transaction row
 */
export function validateRow(row: NormalizedCitiBankRow, rowNumber: number): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!row.amount?.trim()) {
    errors.push({
      row: rowNumber,
      field: 'Amount',
      value: row.amount || '',
      message: `Row ${rowNumber}: ${ERROR_MESSAGES.MISSING_TRANSACTION_AMOUNT}`
    });
  } else {
    validateFieldValue('Amount', row.amount, rowNumber).forEach(errorMessage => {
      errors.push({ row: rowNumber, field: 'Amount', value: row.amount, message: errorMessage });
    });
  }

  if (row.format === 'legacy') {
    validateFieldValue('Value Date', row.valueDate, rowNumber).forEach(errorMessage => {
      errors.push({ row: rowNumber, field: 'Value Date', value: row.valueDate, message: errorMessage });
    });
    validateFieldValue('Customer Reference', row.customerReference, rowNumber).forEach(errorMessage => {
      errors.push({
        row: rowNumber,
        field: 'Customer Reference',
        value: row.customerReference,
        message: errorMessage
      });
    });
    validateFieldValue('Account Number', row.accountNumber || '', rowNumber).forEach(errorMessage => {
      errors.push({
        row: rowNumber,
        field: 'Account Number',
        value: row.accountNumber || '',
        message: errorMessage
      });
    });

    if (row.customerReference.trim().length === 0) {
      errors.push({
        row: rowNumber,
        field: 'Customer Reference',
        value: row.customerReference,
        message: `Row ${rowNumber}: Description cannot be empty`
      });
    }

    return errors;
  }

  // New / latest format
  const dateSource = row.statementDate || row.valueDate;
  if (!dateSource?.trim()) {
    errors.push({
      row: rowNumber,
      field: 'Statement Date|Value Date',
      value: '',
      message: `Row ${rowNumber}: ${ERROR_MESSAGES.MISSING_DATE_FIELDS}`
    });
  } else {
    const dateFieldLabel = row.statementDate ? 'Statement Date' : 'Value Date';
    validateFieldValue(dateFieldLabel, dateSource, rowNumber).forEach(errorMessage => {
      errors.push({ row: rowNumber, field: dateFieldLabel, value: dateSource, message: errorMessage });
    });
  }

  validateFieldValue('Customer Reference', row.customerReference, rowNumber).forEach(errorMessage => {
    errors.push({
      row: rowNumber,
      field: 'Customer Reference',
      value: row.customerReference,
      message: errorMessage
    });
  });

  const description = (row.description ?? '').trim();
  const beneficiary = (row.beneficiaryRemitter ?? '').trim();
  const narrative = (row.narrative ?? '').trim();
  const paymentDetails = (row.paymentDetails ?? '').trim();
  const isDebit = isPaymentRow(row.amount);
  const needsNarrative =
    isDebit &&
    !beneficiary &&
    (
      description === DESCRIPTION_RULES.INCOMING_DIRECT_DEBIT ||
      description === DESCRIPTION_RULES.EFT_DIRECT_DEBIT_RETURNED ||
      (description === DESCRIPTION_RULES.TARGET_BALANCING_SWEEP && row.hasPaymentDetailsColumn)
    );

  if (!description && isDebit && !beneficiary) {
    errors.push({
      row: rowNumber,
      field: 'Description',
      value: '',
      message: `Row ${rowNumber}: ${ERROR_MESSAGES.MISSING_TRANSACTION_DESCRIPTION}`
    });
  }

  if (needsNarrative && !narrative) {
    errors.push({
      row: rowNumber,
      field: 'Narrative',
      value: narrative,
      message: `Row ${rowNumber}: ${ERROR_MESSAGES.MISSING_NARRATIVE}\n\n${ERROR_MESSAGES.DEBIT_ORDER_MISSING_NARRATIVE}`
    });
  }

  const derivedDescription = getOutputDescription(row);
  if (!derivedDescription) {
    if (!isDebit && row.hasPaymentDetailsColumn && !paymentDetails) {
      errors.push({
        row: rowNumber,
        field: 'Payment Details',
        value: paymentDetails,
        message: `Row ${rowNumber}: ${ERROR_MESSAGES.MISSING_PAYMENT_DETAILS}`
      });
    } else if (isDebit && !beneficiary && !description) {
      errors.push({
        row: rowNumber,
        field: 'Description',
        value: '',
        message: `Row ${rowNumber}: ${ERROR_MESSAGES.MISSING_TRANSACTION_DESCRIPTION}`
      });
    } else if (needsNarrative) {
      // Already reported above
    } else {
      errors.push({
        row: rowNumber,
        field: isDebit ? 'Beneficiary/ Remitter|Description' : 'Payment Details',
        value: isDebit ? `${beneficiary}|${description}` : paymentDetails,
        message: isDebit
          ? `Row ${rowNumber}: Payment rows require Beneficiary/ Remitter or Transaction Description`
          : `Row ${rowNumber}: ${ERROR_MESSAGES.MISSING_PAYMENT_DETAILS}`
      });
    }
  }

  return errors;
}

/**
 * Processes complete CSV data and returns formatted result
 */
export function processCSVData(csvContent: string, options: ProcessingOptions = {}): ProcessingResult {
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
    const { index: headerRowIndex, headers } = findCSVHeader(lines);
    if (headerRowIndex === -1) {
      const message = formatUnsupportedFormatMessage(
        findBestHeaderCandidateForError(lines)
      );
      result.errors.push({
        row: 0,
        field: 'structure',
        value: headers.join(', '),
        message
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
    const shouldStopOnError = options.errorHandling === 'stop';

    for (const transaction of transactions) {
      const rowNumber = transaction.sourceRowNumber;
      
      try {
        // Validate the row
        const validationErrors = validateRow(transaction, rowNumber);
        
        if (validationErrors.length > 0) {
          result.errors.push(...validationErrors);
          result.statistics.errorRows++;
          if (shouldStopOnError) {
            break;
          }
          continue;
        }

        // Transform the row
        const transformedRow = transformRow(transaction, options);
        transformedData.push(transformedRow);
        result.statistics.processedRows++;
        
      } catch (error) {
        console.error(`Row ${rowNumber} transformation failed:`, error);
        result.errors.push({
          row: rowNumber,
          field: 'transformation',
          value: JSON.stringify(transaction),
          message: `Row ${rowNumber}: Transformation error: ${error}`
        });
        result.statistics.errorRows++;
        if (shouldStopOnError) {
          break;
        }
      }
    }

    // Calculate success rate
    const totalProcessableRows = transactions.length;
    result.statistics.successRate = totalProcessableRows > 0 
      ? (result.statistics.processedRows / totalProcessableRows) * 100 
      : 0;

    // Set final result
    result.data = transformedData;
    result.success = transformedData.length > 0 && result.statistics.successRate >= 50;

    if (!result.success && transformedData.length === 0 && result.errors.length > 0) {
      const hasRowErrors = result.errors.some((error) => error.row > 0);
      if (hasRowErrors && !result.errors.some((e) => e.field === 'data')) {
        result.errors.unshift({
          row: 0,
          field: 'data',
          value: '',
          message: ERROR_MESSAGES.NO_VALID_TRANSACTIONS
        });
      }
    }

  } catch (error) {
    console.error('CSV processing failed:', error);
    result.errors.push({
      row: 0,
      field: 'processing',
      value: '',
      message: error instanceof Error ? error.message : `Processing error: ${error}`
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
 * Checks if a line is metadata (not transaction data)
 */
function isMetadataRow(line: string): boolean {
  const trimmedLine = line.trim();
  return METADATA_INDICATORS.some(indicator => 
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

function fieldValue(
  fields: string[],
  fieldMap: Partial<Record<LogicalHeaderField, number>>,
  field: LogicalHeaderField
): string {
  const index = fieldMap[field];
  if (index === undefined) {
    return '';
  }
  return (fields[index] ?? '').trim();
}

function mapFieldsToNormalized(
  fields: string[],
  fieldMap: Partial<Record<LogicalHeaderField, number>>,
  format: CitiBankImportFormat,
  sourceRowNumber: number,
  hasPaymentDetailsColumn: boolean
): NormalizedCitiBankRow {
  if (format === 'legacy') {
    return {
      format,
      sourceRowNumber,
      accountNumber: fieldValue(fields, fieldMap, 'accountNumber'),
      valueDate: fieldValue(fields, fieldMap, 'valueDate'),
      amount: fieldValue(fields, fieldMap, 'amount'),
      customerReference: fieldValue(fields, fieldMap, 'customerReference'),
      hasPaymentDetailsColumn: false
    };
  }

  return {
    format,
    sourceRowNumber,
    valueDate: fieldValue(fields, fieldMap, 'valueDate'),
    statementDate: fieldValue(fields, fieldMap, 'statementDate'),
    amount: fieldValue(fields, fieldMap, 'amount'),
    customerReference: fieldValue(fields, fieldMap, 'customerReference'),
    beneficiaryRemitter: fieldValue(fields, fieldMap, 'beneficiary'),
    description: fieldValue(fields, fieldMap, 'description'),
    paymentDetails: fieldValue(fields, fieldMap, 'paymentDetails'),
    narrative: fieldValue(fields, fieldMap, 'narrative'),
    type: fieldValue(fields, fieldMap, 'transactionType'),
    bankReference: fieldValue(fields, fieldMap, 'bankReference'),
    accountNumber: fieldValue(fields, fieldMap, 'accountNumber'),
    accountName: fieldValue(fields, fieldMap, 'accountName'),
    hasPaymentDetailsColumn
  };
}

function isPaymentRow(amount: string): boolean {
  try {
    const transformed = transformAmount(amount);
    return parseFloat(transformed) < 0;
  } catch {
    return false;
  }
}

function findBestHeaderCandidateForError(lines: string[]): string[] {
  let best: string[] = [];
  let bestScore = -1;

  for (const line of lines.slice(0, 30)) {
    if (isMetadataRow(line)) continue;
    const headers = parseCSVRow(line).map(normalizeHeader).filter(Boolean);
    if (headers.length < 2) continue;
    const score = headers.length;
    if (score > bestScore) {
      bestScore = score;
      best = headers;
    }
  }

  return best;
}
