// CitiBank CSV row structure
export interface CitiBankTransaction {
  'Account Number': string;
  'Value Date': string; // MM/DD/YYYY format
  'Customer Reference': string;
  'Amount': string; // Quoted with commas like "1,750,000.00"
}

// Sage Bank Manager output structure  
export interface SageBankTransaction {
  Date: string; // DD/MM/YYYY format
  Description: string;
  Amount: string; // ✅ CORRECT - preserves exact decimal as string
}

// Validation error details
export interface ValidationError {
  row: number;
  field: string;
  value: string;
  message: string;
}

// Processing statistics
export interface ProcessingStatistics {
  totalRows: number;
  metadataRows: number;
  processedRows: number;
  errorRows: number;
  successRate: number;
}

// Processing result interfaces
export interface ProcessingResult {
  success: boolean;
  data: SageBankTransaction[];
  errors: ValidationError[];
  statistics: ProcessingStatistics;
}

// File validation result
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Processing progress tracking
export interface ProcessingProgress {
  step: string;
  percentage: number;
  message: string;
  currentRow?: number;
  totalRows?: number;
}

// App state management
export interface AppState {
  uploadedFile: File | null;
  isProcessing: boolean;
  progress: ProcessingProgress;
  result: ProcessingResult | null;
  error: string | null;
}

// CSV Processing stages
export const ProcessingStage = {
  PARSING: 'PARSING',
  FINDING: 'FINDING', 
  TRANSFORMING: 'TRANSFORMING',
  GENERATING: 'GENERATING'
} as const;

export type ProcessingStageType = typeof ProcessingStage[keyof typeof ProcessingStage];

// File constraints
export interface FileConstraints {
  maxSizeMB: number;
  allowedExtensions: string[];
  requiredHeaders: string[];
}

// Hook return types
export interface CSVProcessorHook {
  processFile: (file: File) => Promise<void>;
  progress: ProcessingProgress;
  currentStep: ProcessingStageType | null;
  result: ProcessingResult | null;
  errors: ValidationError[];
  isProcessing: boolean;
  isComplete: boolean;
  reset: () => void;
}

// App flow states
export type AppFlowState = 'upload' | 'processing' | 'preview' | 'download' | 'error';

// App context interface
export interface AppContextState {
  currentStep: AppFlowState;
  file: File | null;
  processedData: SageBankTransaction[] | null;
  processingResult: ProcessingResult | null;
  error: string | null;
  uploadStatus: 'idle' | 'validating' | 'ready' | 'error';
  validationResult: ValidationResult | null;
}

export interface AppContextActions {
  setFile: (file: File | null) => void;
  setCurrentStep: (step: AppFlowState) => void;
  setProcessedData: (data: SageBankTransaction[] | null) => void;
  setProcessingResult: (result: ProcessingResult | null) => void;
  setError: (error: string | null) => void;
  setUploadStatus: (status: AppContextState['uploadStatus']) => void;
  setValidationResult: (result: ValidationResult | null) => void;
  reset: () => void;
}

// File upload hook interface
export interface FileUploadHook {
  file: File | null;
  uploadStatus: AppContextState['uploadStatus'];
  validationResult: ValidationResult | null;
  handleFileSelect: (files: FileList | null) => void;
  handleDragDrop: (files: FileList | null) => void;
  validateFile: (file: File) => Promise<void>;
  clearFile: () => void;
  isValid: boolean;
}

// Progress tracking hook interface  
export interface ProgressTrackingHook {
  progress: ProcessingProgress;
  currentStep: ProcessingStageType | null;
  stepMessage: string;
  updateProgress: (stage: ProcessingStageType, percentage: number, message: string) => void;
  nextStep: () => void;
  reset: () => void;
  isComplete: boolean;
}
